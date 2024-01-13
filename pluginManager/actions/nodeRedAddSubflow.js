'use strict';
const fs = require("fs");
const path = require("path");

const actionName = "NODE_RED_ADD_SUBFLOW";
const logger = require('log4js').getLogger('action.node_red_add_subflow');

module.exports = actions => {
  actions[actionName] = action;

  /**
   * run action add node-red subflow
   * @param {object} pluginInstance instance of plugin
   * @param {object} parameters parameters for action
   * @param {object} server instance of applciation
   * @return {Promise} resolve on action completed
   */
  function action(pluginInstance, parameters, server) {
    return new Promise((resolve, reject) => {
      let subflows = null;
      if (parameters.file) {
        if (path.isAbsolute(parameters.file[0]))
          parameters.file = "." + parameters.file;
        subflows = JSON.parse(fs.readFileSync(path.resolve(pluginInstance.path.absolute, parameters.file), 'utf8'));
      } else {
        subflows = parameters.subflows;
      }
      const redService = server.plugin_manager.services.get("RED");
      let add = i => {
        if (i >= subflows.length) {
          redService.startWatch();
          return resolve();
        }
        let subflow = subflows[i];
        redService.subflows.add(subflow).then(() => {
          logger.debug("ADDED SUBFLOW", subflow.id);
          return add(i + 1);
        }).catch(err => {
          logger.error("Err:", err);
          return add(i + 1);
        });
      };

      if (redService) {
        if (!subflows)
          return reject("No subflows to add");
        redService.stopWatch();
        add(0);
      } else reject("No Node-RED service");
    });
  }
};
