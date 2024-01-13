'use strict';
const actionName = "COPY_FILES";
var logger = require('log4js').getLogger('action.add_config');
const path = require("path");
const fse = require("fs-extra");

module.exports = actions => {
  actions[actionName] = (pluginInstance, parameters, server) => {
    return new Promise((resolve, reject) => {
      let source = path.resolve(pluginInstance.path.absolute, parameters.source);
      let target = path.resolve(parameters.target);
      logger.debug('copy files from', source, 'to', target);
      fse.copy(source, target, err => {
        if (err) {
          logger.error("On copy action", err);
          return reject(err);
        }
        resolve();
      });
    });
  };
};
