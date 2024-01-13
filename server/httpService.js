/**
 * HTTP service implemented as a loopback application
 */
'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('httpService');
const path = require('path');
const {promisify} = require('util');
const joi = require('joi');
const boom = require('boom');
const extend = require('extend');
const boot = promisify(require('loopback-boot'));
const routeValidationDS = require('../common/dataservice/routeValidationDS');
const metrics = require('../server/services/metrics');
const loopback = require('loopback');

/* eslint-disable no-eval */
const evalJsonValues = schema => {
  let value;
  for (const key in schema) {
    // if cond. fixes guard-for-in eslint rule
    if ({}.hasOwnProperty.call(schema, key)) {
      value = schema[key];
    }

    if (typeof (value) === 'object') {
      for (const subValue in value) {
        // if cond. fixes guard-for-in eslint rule
        if ({}.hasOwnProperty.call(value, subValue)) {
          value[subValue] = eval(value[subValue]);
        }
      }
    } else {
      schema[value] = eval(schema[value]);
    }
  }
  return schema;
};
/* eslint-enable no-eval */

const factory = async (utils, initialConfigService, i18n, context) => {
  logger.debug('start');
  // Application flow
  let app = await require('./loopbackApp')(false, true);
  // log connect actions
  if (initialConfigService.get('debug:app-use-connectLogger')) {
    app.use(log4js.connectLogger(logger, {
      level: 'auto'
    }));
  }
  app.use(metrics.responseCounters);

  if (!i18n) {
    i18n = require('i18n');
    // initialze multilingual support for server side string translation
    var localFolder = path.resolve(__dirname, "../../locales");

    i18n.configure({
      locales: ['en', 'de', 'ru'],
      directory: localFolder,
      defaultLocale: 'en',
      register: global
    });
  }

  logger.info(i18n.__('0006 : Starting Next generation Server %s %s'), utils.getVersion(), process.env.BUILD_NUMBER);
  logger.info(i18n.__('0006 : Starting Next generation Server %s'), utils.getCopyright());

  // parse cookies of http requests
  const cookieParser = require('cookie-parser');
  app.use(cookieParser("secret", {path: "/"}));

  // body-parser is a piece of express middleware that
  // reads a form's input and stores it as a javascript
  // object accessible through `req.body`....
  const bodyParser = require('body-parser');
  app.set('json spaces', 2); // format json responses for easier viewing

  // on each HTTP request create a context, set requestId and clientId
  app.use((req, res, next) => {
    var services = app.plugin_manager.services;
    var authService = services.get('auth-check.service');
    if (authService)
      return authService.scopeRequestContext(req, res, next);
    next();
  });

  app.validate = function(schema, options) {
    logger.debug('route validation');
    return async function validateRequest(req, res, next) {
      logger.debug(req.url);
      logger.debug(req.method);
      let record;

      record = await routeValidationDS.findOne(app.models.routeValidation, req.url, req.method);
      if (!record) {
        logger.debug('No route validation found', req.url, req.method);
        return next();
      }

      logger.trace('Route validation record :', record);
      var toValidate = {};
      let validateWith;
      validateWith = evalJsonValues(record.validation);

      if (!validateWith) {
        return next();
      }

      // we only validate those keys which have a corresponding validation schema
      ['params', 'body', 'query', 'headers', 'cookies', 'signedCookies'].forEach(function(key) {
        if (validateWith[key]) {
          toValidate[key] = req[key];
        }
      });

      return joi.validate(toValidate, validateWith, options, onValidationComplete);

      /**
       *
       * @param {*} err error message
       * @param {*} validated validated data
       * @return {*} callback
       */
      function onValidationComplete(err, validated) {
        if (err) {
          return next(boom.badRequest(err.message, err.details));
        }

        // copy the validated data to the req object
        extend(req, validated);

        return next();
      }
    };
  };

  app.ensureLoggedIn = function() {
    return function(req, res, next) {
      const services = app.plugin_manager.services;
      const authService = services.get('auth-check.service');
      if (authService)
        return authService.ensureAccessToken(req, res, next);
      next();
    };
  };

  app.checkUserLogin = function() {
    var ensureLoggedIn = app.ensureLoggedIn();
    return function(req, res, next) {
      ensureLoggedIn.call(this, req, res, function() {
        // if there is no user id in request
        if (!req.user || !req.user.id) {
          req.user = {};
        }
        next();
      });
    };
  };

  // Middleware does all things of ensureLoggedIn + loads current user to req.user
  app.ensureLoggedUser = function() {
    var ensureLoggedIn = app.ensureLoggedIn();
    return function(req, res, next) {
      ensureLoggedIn.call(this, req, res, function() {
        // if there is no user id in request
        if (!req.user || !req.user.id) {
          return res.status(404).json({
            message: 'User record not found.'
          });
        }

        app.models.user.findById(req.user.id).then(user => {
          // if there is no user with such id
          if (!user)
            return res.status(404).json({
              message: 'User record not found.'
            });

          // user found
          req.userInfo = req.user;
          req.user = user;
          next();
        });
      });
    };
  };

  app.ensureUserRoles = function(roles) {
    var ensureLoggedUser = app.ensureLoggedIn();
    return (req, res, next) => {
      ensureLoggedUser.call(this, req, res, () => {
        var access = false;
        if (req.user.roles && req.user.roles.length > 0) {
          roles.forEach(role => {
            if (req.user.roles.some(r => {
              return r == role;
            })) {
              access = true;
            }
          });
        }
        if (!access)
          return res.status(401).json({
            message: 'Access denied by role permissions'
          });
        next();
      });
    };
  };

  const _ensureHasAccess401 = (res, accessName) => {
    res.status(401).json({
      message: `Access denied by role permissions, don't have '${accessName}' access`
    });
  };
  app.ensureHasAccess = accessName => {
    const {Access, RoleMapping, Role} = app.models;
    var ensureLoggedUser = app.ensureLoggedIn();
    return (req, res, next) => {
      ensureLoggedUser.call(this, req, res, () => {
        const userRoles = req.user.roles;
        if (!userRoles || userRoles.length == 0)
          return _ensureHasAccess401(res, accessName);
        Access.findOne({where: {name: accessName}})
          .then(access => RoleMapping.find({where: {principalId: access.id, principalType: 'ACCESS'}}))
          .then(mappings => Role.find({where: {id: {inq: mappings.map(m => m.roleId)}}}))
          .then(roles => {
            if (roles.find(role => userRoles.indexOf(role.name) !== -1)) {
              next();
            } else {
              _ensureHasAccess401(res, accessName);
            }
          })
          .catch(() => _ensureHasAccess401(res, accessName));
      });
    };
  };

  app.ensureApplication = function(application) {
    return (req, res, next) => {
      let services = app.plugin_manager.services;
      let authService = services.get('auth-check.service');
      return authService.ensureApplicationToken(application, req, res, next);
    };
  };

  app.ensureApplicationByRoles = function(application, roles) {
    let ensureApplication = app.ensureApplication(application);
    return (req, res, next) => {
      ensureApplication.call(this, req, res, () => {
        var access = false;
        if (req.user.roles && req.user.roles.length > 0) {
          roles.forEach(role => {
            if (req.user.roles.some(r => {
              return r == role;
            })) {
              access = true;
            }
          });
        }
        if (!access)
          return res.status(401).json({
            message: 'Access denied by role permissions'
          });
        next();
      });
    };
  };

  app.serviceMode = false;
  await boot(app, __dirname);
  logger.debug('boot finished');
  // to support JSON-encoded bodies
  app.middleware('parse', bodyParser.json({limit: '1000mb'}));
  // to support URL-encoded bodies
  app.middleware('parse', bodyParser.raw({limit: '1000mb'}));
  app.middleware('parse', bodyParser.urlencoded({
    limit: '1000mb',
    extended: false
  }));
  app.middleware('parse', bodyParser.raw({limit: '4096mb'}));

  app.post('/users/password/new', app.ensureLoggedIn(), function(req, res, next) {
    res.sendFile('index.html', {
      root: path.join(__dirname, '../client/')
    });
    app.models.user.resetPassword({
      email: req.body.email.toLowerCase()
    }, function() {
      logger.trace(i18n.__('0017 : ready to change password'));
    });
  });

  // -- Mount static files here--
  // All static middleware should be registered at the end, as all requests
  // passing the static middleware are hitting the file system

  app.use('/utils', loopback.static(path.resolve(__dirname, '../utils')));
  app.use('/img', loopback.static(path.resolve(__dirname, '../server/middleware/img')));

  /**
   * @return {*} promise
   */
  async function _listenHttp() {
    return new Promise(resolve => {
      const httpServer = app.listen(() => {
        resolve(httpServer);
      });
    });
  }

  /**
   * @return {*} promise
  */
  async function _listenHttps() {
    var sslConfig = require('./ssl-config');

    const httpServer = require('https').createServer({
      key: sslConfig.privateKey,
      cert: sslConfig.certificate
    }, app);

    httpServer.on('listening', function() {
      app.set('port', this.address().port);

      let listeningOnAll = false;
      let host = app.get('host');
      if (!host) {
        listeningOnAll = true;
        host = this.address().address;
        app.set('host', host);
      } else if (host === '0.0.0.0' || host === '::') {
        listeningOnAll = true;
      }

      if (!app.get('url')) {
        if (process.platform === 'win32' && listeningOnAll) {
          // Windows browsers don't support `0.0.0.0` host in the URL
          // We are replacing it with localhost to build a URL
          // that can be copied and pasted into the browser.
          host = 'localhost';
        }
        var url = (initialConfigService.get('https') ? 'https' : 'http') + '://' + host + ':' + app.get('port') + '/';
        app.set('url', url);
      }
    });

    return new Promise(resolve => {
      httpServer.listen(app.get('port'), app.get('host'), () => {
        resolve(httpServer);
      });
    });
  }

  app.serve = async () => {
    // const isHttps = configService.get('https');

    const httpServer = initialConfigService.get('https')
      ? _listenHttps()
      : await _listenHttp();

    httpServer.on('error', err => {
      logger.trace(err);
      if (err.code === 'EADDRINUSE') {
        logger.error('Port %s already in use', app.get('port'));
        process.exit(2);
      }
    });

    return httpServer;
  };
  logger.debug('End');
  // return httpServices.listen();
  // return httpServices;

  return {
    loopbackApp: app
  };
};

module.exports = factory;
factory.__dependencies = ['utils', 'initialConfigService', 'i18n', 'context'];
factory.__components = [
  /**
   * API/Service/loopbackApp
   * loopback/express application
   * @module API/Service/loopbackApp
   * @type {object}
   */
  {
    name: 'loopbackApp',
    direct: true
  }

  /**
   * API/Service/httpServer
   * httpServer interface
   * @module API/Service/httpServer
   * @type {object}
   */
  // {
  //   name: 'httpServer',
  //   direct: true
  // }
];
