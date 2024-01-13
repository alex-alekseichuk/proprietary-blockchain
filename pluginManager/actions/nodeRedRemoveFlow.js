'use strict';

const actionName = "NODE_RED_REMOVE_FLOW";
var logger = require('log4js').getLogger('action.node_red_remove_flow');
// var RED = require('node-red');

module.exports = function(actions) {
  actions[actionName] = action;

  /**
   * run action remove node-red flow
   * @param {object} pluginInstance instance of plugin
   * @param {object} parameters parameters for action
   * @param {object} server instance of applciation
   * @return {Promise} resolve on action completed
   */
  function action(pluginInstance, parameters, server) {
    return new Promise((resolve, reject) => {
      const redService = server.plugin_manager.services.get("RED");
      let flows = parameters.flows;
      let run = i => {
        if (i >= flows.length) {
          redService.startWatch();
          return resolve();
        }
        let flow = flows[i];
        redService.flows.remove(flow).then(() => {
          logger.debug("REMOVED FLOW", flow);
          run(i + 1);
        }).catch(err => {
          logger.error("Err:", err);
          run(i + 1);
        });
      };

      if (redService) {
        if (!flows)
          return reject("No flows to add");
        redService.stopWatch();
        run(0);
      } else reject("No Node-RED service");
    });
  }
};
