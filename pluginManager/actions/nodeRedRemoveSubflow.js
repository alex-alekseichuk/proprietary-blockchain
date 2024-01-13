'use strict';
const actionName = "NODE_RED_REMOVE_SUBFLOW";
var logger = require('log4js').getLogger('action.node_red_remove_subflow');

module.exports = function(actions) {
  actions[actionName] = action;

  /**
   * run action remove node-red subflow
   * @param {object} pluginInstance instance of plugin
   * @param {object} parameters parameters for action
   * @param {object} server instance of applciation
   * @return {Promise} resolve on action completed
   */
  function action(pluginInstance, parameters, server) {
    return new Promise((resolve, reject) => {
      const redService = server.plugin_manager.services.get("RED");
      let subflows = parameters.subflows;
      let run = i => {
        if (i >= subflows.length) {
          redService.startWatch();
          return resolve();
        }
        let subflow = subflows[i];
        redService.subflows.remove(subflow).then(() => {
          logger.debug("REMOVED SUBFLOW", subflow);
          run(i + 1);
        }).catch(err => {
          logger.error("Err:", err);
          run(i + 1);
        });
      };

      if (redService) {
        if (!subflows)
          return reject("No subflows to add");
        redService.stopWatch();
        run(0);
      } else reject("No Node-RED service");
    });
  }
};
