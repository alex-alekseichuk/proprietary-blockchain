'use strict';
const actionName = "EVAL_JS";
var logger = require('log4js').getLogger('action.eval_js');
var _eval = require('eval');

module.exports = function(actions, configService) {
  actions[actionName] = action;

  /**
   * run action eval js script
   * @param {object} pluginInstance instance of plugin
   * @param {object} parameters parameters for action
   * @param {object} server instance of applciation
   * @return {Promise} resolve on action completed
   */
  function action(pluginInstance, parameters, server) {
    return new Promise((resolve, reject) => {
      var jsCode = null;
      if (parameters.file) {
        var fs = require('fs');
        var path = require('path');

        jsCode = fs.readFileSync(path.resolve(pluginInstance.path.absolute, parameters.file), 'utf8');
      } else if (parameters.js_code) {
        jsCode = parameters.js_code;
      }

      logger.debug('eval_js plugin: %s, script: %s, file: %s', pluginInstance.name, parameters.name, parameters.file);
      if (jsCode) {
        try {
          _eval(jsCode, parameters.name, {server: server}, true);
        } catch (err) {
          logger.error('eval_js error in plugin: %s, script: %s, file: %s', pluginInstance.name, parameters.name, parameters.file, err);
        }
        resolve();
      } else {
        logger.debug('action eval_js error');
        reject("action eval_js error");
      }
    });
  }
};
