'use strict';
const actionName = "NODE_RED_INSTALL_MODULE";
var logger = require('log4js').getLogger('action.rehister_red_flow');
// var RED = require('node-red');
var path = require('path');

module.exports = (actions, configService) => {
  actions[actionName] = {
    callback: action,
    mutateContainer: true
  };

  /**
   * run action install node-red module
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
        if (parameters.path)
          modulePath = path.resolve(pluginInstance.path.absolute, parameters.path) + '/';
        if (!modulePath)
          return reject("No module to install");
        let version;
        try {
          let packageFile = path.resolve(modulePath, "package.json");
          delete require.cache[require.resolve(packageFile)];
          let pkg = require(packageFile);
          if (pkg)
            version = pkg.version;
        } catch (err) {
          logger.error("Error get package.json of", modulePath, err);
        }
        logger.debug('NODE RED install node:', modulePath, "version", version);
        return redService.nodes.installModule(modulePath, version)
          .catch(err => {
            logger.error(err);
            reject(err);
          // }).then(() => {
          //   return redService.restart();
          }).then(resolve).catch(reject);
      }
      reject("No Node-RED service");
    });
  }
};
