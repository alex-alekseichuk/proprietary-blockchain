'use strict';

const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const configService = require('ng-configservice');
configService.read('config/server/config.json');
const serviceManager = require('../services');
const configDiff = require('../../utils/compareConfig.js');
const logger = require('log4js').getLogger('routes.public');
const metricsClient = require("./../services/metricsClient");

/**
 * API/Route/public
 *
 * @module API/Route/public
 * @type {Object}
 */

module.exports = server => {
  server.get('/', /* server.ensureJwtCookie(), */ function(req, res, next) {
    res.redirect('/admin/');
  });

  const namespace = configService.get('namespace') ? configService.get('namespace') : "ng-rt-core";

  /**
   * Retrieve version information
   *
   * @name  Retrieve version information
   * @route {GET} /${namespace}/version
   * @authentication None
   * @bodyparam {String} buildId
   * @bodyparam {String} version
   * @bodyparam {String} hostname
   * @bodyparam {String} bootDateTime
   * @bodyparam {String} buildDateTime
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/version`, function(req, res, next) {
    var buildId = process.env.BUILD_ID ? process.env.BUILD_ID : "-";
    var buildDateTime = process.env.BUILD_DATETIME ? process.env.BUILD_DATETIME : "-";
    var buildNumber = process.env.BUILD_NUMBER ? process.env.BUILD_NUMBER : "-";
    var version = process.env.BUILD_VERSION ? process.env.BUILD_VERSION : "-";
    var hostname = process.env.HOSTNAME ? process.env.HOSTNAME : "-";
    var bootDateTime = process.env.BOOT_DATETIME ? process.env.BOOT_DATETIME : "-";
    var result = {
      buildId: buildId,
      version: version,
      hostname: hostname,
      bootDateTime: bootDateTime,
      buildDateTime: buildDateTime,
      build_number: buildNumber
    };
    res.status(200).json(result).end();
  });

  /**
   * Retrieve a list of all Users which are Online
   *
   * @name  Retrieve a list of all Users which are Online
   * @route {GET} /${namespace}/users-online
   * @returnparam {object} [status] 200 = OK  500 = Error
   * @authentication None
   */
  server.get(`/${namespace}/users-online`, function(req, res, next) {
    const socketManager = serviceManager.get('socketManager');
    const showUsersOnline = JSON.stringify(configService.get('showUsersOnline'));

    if (showUsersOnline === "true") {
      res.status(200).json(
        _.map(socketManager.io.sockets.sockets, socket => {
          return socket.user;
        })
      ).end();
    } else {
      res.status(200).json("Nothing to show").end();
    }
  });

  /**
   * Retrieve a list of all active Routes
   *
   * @name  Retrieve a list of all active Routes
   * @route {GET} /${namespace}/routes
   * @authentication None
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/routes`, function(req, res, next) {
    const showRoutes = JSON.stringify(configService.get('showRoutes'));

    if (showRoutes === "true") {
      res.status(200).json(server._router.stack.filter(r => r.route).map(r => ({
        path: r.route.path,
        method: Object.keys(r.route.methods).join(',')
      }))).end();
    } else {
      res.status(200).json("Nothing to show").end();
    }
  });

  /**
   * Serve /docs directory statically for documentation
   *
   * @name Serve /docs directory statically for documentation
   * @route {GET} /${namespace}/docs
   */
  server.use(`/${namespace}/docs`, server.loopback.static(path.resolve(__dirname, '../../config/docs')));

  /**
   * Retrieve a list of all active Services
   *
   * @name  Retrieve a list of all active Services
   * @route {GET} /${namespace}/services
   * @authentication None
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/services`, function(req, res, next) {
    var listServices = serviceManager.list();

    const showServices = JSON.stringify(configService.get('showServices'));

    if (showServices === "true") {
      res.status(200).json(listServices).end();
    } else {
      res.status(200).json("Nothing to show").end();
    }
  });

  /**
   * Determine the healthcheck of the System
   *
   * @name  Determine the healthcheck of the System. Returns whether Plugin Manager has loaded all Plugins and System is ready
   * @route {GET} /${namespace}/healthcheck
   * @authentication None
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/healthcheck`, function(req, res) {
    metricsClient.increment(`server, method=healtcheck, status=success, instance=${process.env.HOSTNAME}`, 1);
    return res.status(200).end();
  });

  /**
   * Determine the readinesscheck of the System
   *
   * @name  Determine the readinesscheck of the System. Returns whether Plugin Manager has loaded all Plugins and System is ready
   * @route {GET} /${namespace}/readinesscheck
   * @authentication None
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/readinesscheck`, function(req, res) {
    let response;
    if (server.plugin_manager && server.plugin_manager.ready) {
      metricsClient.increment(`server, method=readinesscheck, status=success, instance=${process.env.HOSTNAME}`, 1);
      response = {message: 'System is ready'};
      return res.status(200).json(response).end();
    }
    metricsClient.increment(`server, method=readinesscheck, status=failure, instance=${process.env.HOSTNAME}`, 1);
    response = {message: 'System is not ready yet'};
    return res.status(500).json(response).end();
  });

  /**
   * Logging frontend console logs to server
   *
   * @name Logging frontend console logs to server
   * @route {POST} /${namespace}/log
   * @authentication Requires an Application Token for authentication
   * @returnparam {object} [status] 200 = OK  400 = Error
   */
  server.post(`/${namespace}/log`, server.ensureLoggedIn(), function(req, res) {
    logger.trace('log route');
    // Get loopback Log model
    if (configService.get("databaseType") === 'postgresql')
      return res.status(400).json({message: 'log in postgresql not supported'});

    let Log = server.loopback.findModel('log');

    // Get LoggingEvents array from POST query
    let LoggingEvents = req.body.Log4js;

    // Save each LoggingEvent to the database
    Promise.all(LoggingEvents.map(o => {
      logger.trace('create log', o);
      let LoggingEvent = o.LoggingEvent;
      let _event = {
        timestamp: LoggingEvent.timestamp,
        data: LoggingEvent.data,
        level: LoggingEvent.level,
        category: LoggingEvent.category
      };

      // Insert new log record into the database
      return Log.create(_event);
    }))
      .then(objects => {
        logger.trace('All logs create');
        res.sendStatus(200);
      })
      .catch(err => {
        logger.error('failed write log');
        logger.error(err);
        res.status(500).json(err).end();
      });
  });

  /**
   * Compare config.json vs config-full.json
   *
   * @name Compare config.json vs config-full.json
   * @route {GET} /${namespace}/config-diff
   * @returnparam {JSON} Difference between config.json and config-full.json
   * @returnparam {object} [status] 200 = OK
   */
  server.get(`/${namespace}/config-diff`, function(req, res) {
    const showConfigDiff = JSON.stringify(configService.get('showConfigDiff'));

    if (showConfigDiff === "true") {
      res.json(configDiff);
    } else {
      res.status(200).json("Nothing to show").end();
    }
  });

  /**
   * Get plugin config for client side
   *
   * @name Get plugin config for client side
   * @route {GET} /${namespace}/config/:plugin/client
   * @returnparam {JSON} Plugin's client config
   * @returnparam {object} [status] 200 = OK  400 = Error
   */
  server.get(`/${namespace}/config/:plugin/client`, function(req, res) {
    // Plugin's config path
    let pluginConfigPath = path.join(__dirname, `../../config/plugins/${req.params.plugin}.json`);

    // If config file doesn't exist return 400
    if (!fs.existsSync(pluginConfigPath)) {
      return res.sendStatus(400);
    }

    // If config file exists return client configuration
    let config = require(pluginConfigPath);
    let clientConfig = config.client || {};
    return res.json(clientConfig);
  });
};
