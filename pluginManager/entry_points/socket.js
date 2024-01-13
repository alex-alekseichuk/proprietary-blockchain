'use strict';
const pointName = "socket";
var logger = require('log4js').getLogger('entrypoint.socket');

module.exports = function(points, configService, filemanager) {
  points[pointName] = point;
  points[pointName + "_deactivate"] = repoint;

  /**
   * Entrypoint for socket
   * @param {string} plugin - plugin name
   * @param {object} parameters - entrypoint parameters
   * @param {object} server - instance of loopback application
   * @param {object} pluginInstance - insance of Plugin
   * @return {Promise} - Promise entrypoint for state machine
   */
  function point(plugin, parameters, server, pluginInstance) {
    return new Promise((resolve, reject) => {
      var fileName = parameters.file;
      var socket = pluginInstance.storage.require(pluginInstance.name, fileName);
      logger.trace('entry point socket', typeof socket);
      if (typeof socket === 'function')
        socket(server.socket_manager, server.plugin_manager.services, pluginInstance);
      if (typeof socket === 'object')
        try {
          socket.activate(server.socket_manager, server.plugin_manager.services, server, pluginInstance);
        } catch (e) {
          logger.error('Error on activate socket', e);
          return reject(e);
        }
      logger.trace('resolve');
      resolve();
    });
  }

  /**
   * Reemoving entrypoint for socket
   * @param {string} plugin - plugin name
   * @param {object} parameters - entrypoint parameters
   * @param {object} server - instance of loopback application
   * @param {object} pluginInstance - insance of Plugin
   * @return {Promise} - Promise entrypoint for state machine
   */
  function repoint(plugin, parameters, server, pluginInstance) {
    return new Promise((resolve, reject) => {
      var fileName = parameters.file;
      var socket = pluginInstance.storage.require(pluginInstance.name, fileName);
      logger.trace('switch off entry point socket');
      if (typeof socket === 'object' && socket.deactivate)
        try {
          socket.deactivate(server.socket_manager, server.plugin_manager.services);
        } catch (e) {
          return reject(e);
        } else {
        logger.trace('no deactivate function');
      }
      logger.trace('resolve');
      resolve();
    });
  }
};
