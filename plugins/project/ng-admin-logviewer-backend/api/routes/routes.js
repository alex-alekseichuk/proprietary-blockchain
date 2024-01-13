'use strict';

const logger = require('log4js').getLogger('ng-admin-logviewer-backend.routes');
const path = require('path');

/**
 * API/Route/ng-admin-logviewer-backend
 *
 * @module API/Route/ng-admin-logviewer-backend
 * @type {Object}
 */

let server;
let i18n;
let pluginSettings;
let namespace;
let services;
let configService;

const init = (_server, plugin) => {
  server = _server;
  services = server.plugin_manager.services;
  i18n = services.get('i18n');
  pluginSettings = server.plugin_manager.configs.get(plugin);
  namespace = pluginSettings.get('namespace');
  configService = services.get("configService");
};

const postLog = (req, res) => {
  const qStr = {
    limit: req.body.limit,
    skip: req.body.skip,
    where: req.body.where
  };
  server.models.log
    .find(qStr)
    .then(result => {
      res.json({
        success: true,
        result
      });
    })
    .catch(err => {
      logger.error("error:", err);
      res.json({
        success: false
      });
    });
};

const postLogCount = (req, res) => {
  const where = req.body.where;
  server.models.log
    .count(where)
    .then(result => {
      res.json({
        success: true,
        result
      });
    })
    .catch(err => {
      logger.error("error:", err);
      res.json({
        success: false
      });
    });
};

const activate = (server, plugin, pluginInstance) => {
  init(server, plugin);

  logger.info(i18n.__('Plugin name : %s', pluginInstance.name));
  logger.info(i18n.__('ng-admin-logviewer-backend routes init'));
  logger.info(i18n.__('Server type : %s', configService.get('serverEnvironment')));

  // retrieve Plugin specific configuration
  logger.info(i18n.__('setting1 :%s', pluginSettings.get('setting1')));

  // Static route for HTML renderer
  server.use('/ng-admin-logviewer-backend', server.loopback.static(path.normalize(
  path.resolve(__dirname, '../../ui'))));

  /**
 * Get log
 *
 * @name post log
 * @route {POST} /${namespace}/log
 * @authentication Requires an valid Session Token
 */
  server.post(`/${namespace}/log`, server.ensureLoggedIn(), postLog);

/**
 * Get count log
 *
 * @name post count log
 * @route {POST} /${namespace}/logCount
 * @authentication Requires an valid Session Token
 */
  server.post(`/${namespace}/logCount`, server.ensureLoggedIn(), postLogCount);
};

const deactivate = {
};

module.exports = {
  init,
  activate,
  postLog,
  postLogCount,
  deactivate
};
