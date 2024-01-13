'use strict';
const fs = require("fs");
const path = require("path");

const actionName = "NODE_RED_ADD_FLOW";
var logger = require('log4js').getLogger('action.node_red_add_flow');
// var RED = require('node-red');
module.exports = actions => {
  actions[actionName] = action;

  /**
   * run action add node-red flow
   * @param {object} pluginInstance instance of plugin
   * @param {object} parameters parameters for action
   * @param {object} server instance of applciation
   * @return {Promise} resolve on action completed
   */
  function action(pluginInstance, parameters, server) {
    return new Promise((resolve, reject) => {
      let flows = null;
      if (parameters.file) {
        if (path.isAbsolute(parameters.file[0]))
          parameters.file = "." + parameters.file;
        flows = JSON.parse(fs.readFileSync(path.resolve(pluginInstance.path.absolute, parameters.file), 'utf8'));
      } else {
        flows = parameters.flows;
      }
      const redService = server.plugin_manager.services.get("RED");
      let add = i => {
        if (i >= flows.length) {
          redService.startWatch();
          return resolve();
        }
        let flow = flows[i];
        redService.flows.add(flow, parameters.replace).then(() => {
          logger.debug("ADDED FLOW", flow.id);
          return add(i + 1);
        }).catch(err => {
          logger.error("Err:", err);
          return add(i + 1);
        });
      };

      if (redService) {
        if (!flows)
          return reject("No flows to add");
        redService.stopWatch();
        add(0);
      } else reject("No Node-RED service");
    });
  }
};
