'use strict';
var logger = require('log4js').getLogger('action.gulp');
var path = require('path');

const actionName = "GULP";
module.exports = function(actions, configService) {
  actions[actionName] = action;

  /**
   * run action run gulp action
   * @param {object} pluginInstance instance of plugin
   * @param {object} parameters parameters for action
   * @param {object} server instance of applciation
   * @return {Promise} resolve on action completed
   */
  function action(pluginInstance, parameters, server) {
    return new Promise((resolve, reject) => {
      logger.debug('run gulp', pluginInstance.name, parameters);
      if (!parameters.file) {
        reject('no file parameter');
        return;
      }
      var filePath = path.resolve(pluginInstance.path.absolute, parameters.file);
      logger.debug(filePath);
      delete require.cache[require.resolve(filePath)];
      var run = require(filePath);
      logger.debug('start gulp');
      run(path.resolve(pluginInstance.path.absolute, 'ui'));
      logger.debug('gulp started');
      resolve();
    });
  }
};
