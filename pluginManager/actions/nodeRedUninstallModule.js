'use strict';
const actionName = "NODE_RED_UNINSTALL_MODULE";
var logger = require('log4js').getLogger('action.rehister_red_flow');
// var RED = require('node-red');
// var path = require('path');

module.exports = function(actions) {
  actions[actionName] = {
    callback: action,
    mutateContainer: true
  };

  /**
   * run action uninstall node-red module
   * @param {object} pluginInstance instance of plugin
   * @param {object} parameters parameters for action
   * @param {object} server instance of applciation
   * @return {Promise} resolve on action completed
   */
  function action(pluginInstance, parameters, server) {
    return new Promise((resolve, reject) => {
      const redService = server.plugin_manager.services.get("RED");
      if (redService) {
        redService.stopWatch();
        var modulePath = parameters.name;
        if (!modulePath)
          return reject('No parameter name to uninstall node-red module');
        logger.debug('NODE RED uninstall module:', modulePath);
        return redService.nodes.stopFlows().then(() => {
          return redService.nodes.uninstallModule(modulePath);
        }).catch(err => {
          logger.error(err);
          return reject(err);
        }).then(() => {
          return redService.nodes.startFlows();
        }).then(resolve).catch(reject).then(() => {
          redService.startWatch();
        });
      }
      return reject("No Node-RED service");
    });
  }
};
