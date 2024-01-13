/**
 * Created by alibe on 18.07.2016.
 */
'use strict';
// var logger = require('log4js').getLogger('action.register_model');
var path = require('path');

const actionName = "REGISTER_MODEL";
module.exports = function(actions, configService) {
  actions[actionName] = action;

  /**
   * run action register loopback model
   * @param {object} pluginInstance instance of plugin
   * @param {object} parameters parameters for action
   * @param {object} server instance of applciation
   * @return {Promise} resolve on action completed
   */
  function action(pluginInstance, parameters, server) {
    return new Promise((resolve, reject) => {
      let customizeFn;
      let definitionJson;

      if (!parameters.json)
        return reject("No json parameter.");
      if (!parameters.dataSource)
        return reject("No dataSource parameter.");
      let jsonPath = path.resolve(pluginInstance.path.absolute, parameters.json);
      delete require.cache[require.resolve(jsonPath)];
      definitionJson = require(jsonPath);

      if (!definitionJson)
        return reject("Failed to load definition json file");

      if (parameters.js) {
        let jsPath = path.resolve(pluginInstance.path.absolute, parameters.js);
        delete require.cache[require.resolve(jsPath)];
        customizeFn = require(jsPath);
        if (!customizeFn)
          return reject("Parameter js presented but fail to require");
      }

      let Model = server.registry.createModel(definitionJson);

      if (customizeFn)
        customizeFn(Model);

      server.model(Model, {
        public: Boolean(parameters.public),
        dataSource: parameters.dataSource
      });

      server.dataSources[parameters.dataSource].autoupdate(Model.name, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
};
