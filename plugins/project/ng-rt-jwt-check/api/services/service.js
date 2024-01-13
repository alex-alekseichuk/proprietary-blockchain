// JWT implementation of special service with name: auth-check.service
// for checking logged_in mode of the incoming http request
/* eslint-disable complexity */
'use strict';
/* global _ctx*/
const logger = require('log4js').getLogger('jwt-check.service');
const jwt = require('jsonwebtoken');

const SERVICE_NAME = 'auth-check.service';

/**
 * @param {Object} services Services container
 * @return {Object} services container
 */
function JwtCheckServiceFactory(services) {
  logger.debug('activate ng-rt-jwt-check service');

  const configService = services.get('configService');
  const utils = services.get('utils');
  const JWT_SECRET = configService.get("jwt.secret");
  const loopbackApp = services.get('loopbackApp');
  const pluginSettings = loopbackApp.plugin_manager.configs.get('ng-rt-jwt-check');

  var reply = (req, res, code) => {
    return res.status(code || 401).end();
  };
  var reply401 = (req, res) => {
    res.status(401);
    if (pluginSettings.get('json401Reply') && req.accepted &&
      req.accepted.some(type => type.value === 'application/json'))
      res.send({message: 'Unauthorized'});
    res.end();
  };

  const processAccessToken = token => {
    return new Promise(resolve => {
      jwt.verify(token, JWT_SECRET, (err, payload) => {
        // expired or incorrect token
        // @todo: process here only expired tokens and move other incorrectness to 401 below
        if (err) {
          return resolve(400);
        }

        // correct but non-access token
        if (!payload.uid || payload.otp) {
          return resolve(401);
        }

        const userContext = {
          id: payload.uid,
          username: payload.username,
          roles: payload.roles || [],
          trust_level: payload.trust_level,
          domainId: payload.domainId || configService.get('defaultDomainId'),
          vault: payload.vault
        };

        // save user info into global context
        if (_ctx)
          _ctx.set('user', userContext);

        let isAdmin = userContext.roles.some(r => {
          return (r === "admin" || r === "sysadmin" || r === "appadmin" || r === "licadmin");
        });

        // Check if system is in Maintenance mode and block user others than the role 'Admin, sysadmin and Appadmin'
        let maintenanceEnabled = services.get('configService').get("maintenance.enabled");

        if (!isAdmin && maintenanceEnabled == true) {
          logger.trace('System is in maintenance mode and NOT an admin role');
          return resolve(445);
        }

        if (!loopbackApp.plugin_manager || (!isAdmin && !loopbackApp.plugin_manager.ready)) {
          logger.trace('System still booting and NOT an admin role');
          return resolve(444);
        }

        resolve(userContext);
      });
    });
  };

  var ensureAccessToken = (req, res, next) => {
    // try to get access token from HTTP header
    let authHeader = req.get('Authorization');

    let token;

    // extract project token
    if (!token) {
      token = authHeader && authHeader.substr(0, 4) === 'JWT ' ? authHeader.substr(4) :
        (req.cookies.token || req.query.token);
    }

    if (!token) {
      return reply401(req, res);
    }

    processAccessToken(token).then(result => {
      switch (result) {
        case 400:
          reply(req, res, result);
          break;
        case 401:
          reply401(req, res);
          break;
        case 444:
        case 445:
          res.status(result).end();
          break;
        default:
          req.user = result;
          next();
      }
    });
  };

  var ensureApplicationToken = (application, req, res, next) => {
    let authHeader = req.get('Authorization');

    let token;

    // extract project token
    if (!token) {
      token = authHeader && authHeader.substr(0, 4) === 'JWT ' ? authHeader.substr(4) :
        (req.cookies.token || req.query.token);
    }

    if (!token) {
      logger.debug("No token");
      return reply401(req, res);
    }
    logger.debug('JWT token: ', token);
    jwt.verify(token, JWT_SECRET, (err, payload) => {
      if (err) {
        logger.error(err);
        return reply401(req, res);
      }

      logger.debug("payload.application :", payload.application);
      logger.debug("application :", application);

      // correct but non-access token
      if (!payload.application || payload.application !== application) {
        logger.debug("incorrect token", payload, application);
        return reply401(req, res);
      }

      req.user = {
        id: payload.uid,
        applicationId: payload.application,
        domainId: payload.domainID,
        roles: payload.roles,
        vault: payload.vault
      };

      if (_ctx)
        _ctx.set('user', req.user);

      next();
    });
  };

  const getSessionId = async req => {
    const authHeader = req.get('Authorization');
    const token = authHeader && authHeader.substr(0, 4) === 'JWT ' ? authHeader.substr(4) :
      (req.cookies.token || req.query.token);
    return new Promise(resolve => {
      if (!token) {
        resolve();
        return;
      }

      jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (!err && payload && payload.sessionId) {
          resolve(payload.sessionId);
        } else {
          resolve();
        }
      });
    });
  };

  const scopeRequestContext = async (req, res, next) => {
    if (!_ctx)
      return next();
    _ctx.scope(() => next(), {
      clientId: req.get('X-ClientId'),
      sessionId: await getSessionId(req),
      requestId: utils.generateId()
    });
  };

  let jwtCheckService = {
    ensureAccessToken,
    ensureApplicationToken,
    scopeRequestContext,
    processAccessToken
  };

  services.add(SERVICE_NAME, jwtCheckService);

  return jwtCheckService;
}

module.exports = {
  activate: JwtCheckServiceFactory,
  deactivate: SERVICE_NAME
};
