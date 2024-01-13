'use strict';

var logger = require('log4js').getLogger('ng-rt-documentation.routes');
var path = require('path');
/**
 * API/Route/documentation/
 *
 * @module API/Route/documentation
 * @type {Class}
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
  pluginSettings = server.plugin_manager.configs.get('ng-rt-documentation');
  namespace = pluginSettings.get('namespace');
  configService = services.get("configService");
};

const getDocumentation = (req, res) => {
  logger.debug(i18n.__('Status getDocumentation'));

  var url = configService.get('ng-rt-documentation.url');
  return res.redirect(url ? url : '/documentation-html');
};

const activate = (server, plugin, pluginInstance) => {
  logger.debug('executing ng-rt-documentation.routes');
  init(server, plugin);

  /**
   * Return a redirect to the documentation URL
   *
   * @name Redirect to the documentation URL
   * @route {GET} /{namespace}/documentation
   * @authentication Requires valid session token
   */
  server.get(`/${namespace}/documentation`, getDocumentation);

  server.use(`/${namespace}`, server.loopback.static(path.resolve(pluginInstance.path.absolute, 'client', 'public')));
};

const deactivate = {
  "launch": {
    path: '/ng-rt-documentation/documentation'
  },
  "local-documentation": {
    path: "/documentation-html"
  },
  "root": {
    path: "/ng-rt-documentation"
  }
};

module.exports = {
  init,
  activate,
  deactivate
};
