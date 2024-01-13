'use strict';

/* eslint-disable no-useless-escape */

const actionName = "CREATE_DATASOURCE";
const path = require("path");
const fs = require("fs");
// var logger = require('log4js').getLogger('action.create_datasource');
module.exports = function(actions, configService, i18n) {
  actions[actionName] = action;

  /**
   * run action create data source
   * @param {object} pluginInstance instance of plugin
   * @param {object} parameters parameters for action
   * @param {object} server instance of applciation
   * @return {Promise} resolve on action completed
   */
  function action(pluginInstance, parameters, server) {
    return new Promise((resolve, reject) => {
      let data = parameters.data;
      if (parameters.file) {
        if (path.isAbsolute(parameters.file[0]))
          parameters.file = "." + parameters.file;
        data = JSON.parse(fs.readFileSync(path.resolve(pluginInstance.path.absolute, parameters.file), 'utf8'));
      }

      for (let key in data) {
        if (typeof data[key] === "string") {
          let variables = data[key].match(/\$\{[\w\.]+\}/g);
          if (variables) {
            variables.forEach(variable => {
              if (variable.indexOf('plugin:') > -1) {
                let variableName = variable.match(/\$\{plugin\:([\w\.]+)\}/);
                if (variableName) {
                  let val = pluginInstance.config.get(variableName[1]);
                  data[key].replace(variable, val);
                }
              } else {
                let variableName = variable.match(/\$\{([\w\.]+)\}/);
                if (variableName) {
                  let val = configService.get(variableName[1]);
                  data[key] = data[key].replace(variable, val);
                }
              }
            });
          }
        }
      }

      if (!data.name) {
        return reject(i18n.__('name is required'));
      }
      return server.models.dataSource.destroyAll({
        name: data.name
      }).then(() => {
        return server.models.dataSource.create(data);
      }).then(resolve).catch(reject);
    });
  }
};
