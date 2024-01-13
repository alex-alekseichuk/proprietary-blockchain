'use strict';
const actionName = "REMOVE_CONFIG";
var logger = require('log4js').getLogger('action.remove_config');
var configService = require('ng-configservice');
configService.read('config/server/config.json');

module.exports = function(actions) {
  actions[actionName] = action;

  /**
   * run action remove config value
   * @param {object} pluginInstance instance of plugin
   * @param {object} parameters parameters for action
   * @param {object} server instance of applciation
   * @return {Promise} resolve on action completed
   */
  function action(pluginInstance, parameters, server) {
    return new Promise((resolve, reject) => {
      configService.remove(parameters.key).then(() => {
        logger.debug('remove_config resolved');
        resolve();
      }).catch(err => {
        logger.error('remove_config error', err);
        reject(err);
      });
    });
  }
};
