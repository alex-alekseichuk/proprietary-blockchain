'use strict';
const pointName = "service";
var logger = require('log4js').getLogger('entrypoint.service');

module.exports = function(points, configService, filemanager) {
  points[pointName] = point;
  points[pointName + "_deactivate"] = repoint;

  /**
   * Entrypoint for services
   * @param {string} plugin - plugin name
   * @param {object} parameters - entrypoint parameters
   * @param {object} server - instance of loopback application
   * @param {object} pluginInstance - insance of Plugin
   * @return {Promise} - Promise entrypoint for state machine
   */
  function point(plugin, parameters, server, pluginInstance) {
    return new Promise((resolve, reject) => {
      var fileName = parameters.file;
      var serviceEntrypoint = pluginInstance.storage.require(pluginInstance.name, fileName);
      logger.debug('activate service entrypoint', typeof serviceEntrypoint);
      if (typeof serviceEntrypoint === 'function') {
        serviceEntrypoint(server.plugin_manager.services, pluginInstance);
      } else if (typeof serviceEntrypoint === 'object' && serviceEntrypoint.activate) {
        serviceEntrypoint.activate(server.plugin_manager.services, pluginInstance);
      }
      logger.debug('resolve');
      resolve();
    });
  }

    /**
   * Remove rntrypoint for service
   * @param {string} plugin - plugin name
   * @param {object} parameters - entrypoint parameters
   * @param {object} server - instance of loopback application
   * @param {object} pluginInstance - insance of Plugin
   * @return {Promise} - Promise entrypoint for state machine
   */
  function repoint(plugin, parameters, server, pluginInstance) {
    return new Promise((resolve, reject) => {
      var fileName = parameters.file;
      var serviceEntrypoint = pluginInstance.storage.require(pluginInstance.name, fileName);
      logger.debug('deactivate service entrypoint', typeof serviceEntrypoint);

      if (typeof serviceEntrypoint === 'object' && serviceEntrypoint.deactivate) {
        if (typeof serviceEntrypoint.deactivate == 'function')
          serviceEntrypoint.deactivate(server.plugin_manager.services, pluginInstance);
        if (typeof serviceEntrypoint.deactivate === 'object')
          server.plugin_manager.services.remove(serviceEntrypoint.deactivate);
      } else {
        const errMsg = 'No deactivate function or object for service entrypoint found.';
        logger.debug(errMsg);
        return reject(errMsg);
      }
      logger.debug('resolve');
      return resolve();
    });
  }
};
