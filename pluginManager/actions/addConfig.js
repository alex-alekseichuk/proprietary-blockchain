'use strict';
const actionName = "ADD_CONFIG";
var logger = require('log4js').getLogger('action.add_config');
var configService = require('ng-configservice');
configService.read('config/server/config.json');

module.exports = function(actions) {
  actions[actionName] = action;

  /**
   * run action add config value
   * @param {object} pluginInstance instance of plugin
   * @param {object} parameters parameters for action
   * @param {object} server instance of applciation
   * @return {Promise} resolve on action completed
   */
  function action(pluginInstance, parameters, server) {
    return new Promise((resolve, reject) => {
      configService.add(parameters.key, parameters.data).then(() => {
        logger.debug('add_config resolved');
        resolve();
      }).catch(err => {
        logger.error('add_config error', err);
        reject(err);
      });
    });
  }
};
