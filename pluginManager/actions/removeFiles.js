'use strict';
const actionName = "REMOVE_FILES";
var logger = require('log4js').getLogger('action.add_config');
const path = require("path");
const fse = require("fs-extra");

module.exports = actions => {
  actions[actionName] = (pluginInstance, parameters, server) => {
    return new Promise((resolve, reject) => {
      let target = path.resolve(parameters.target);
      logger.debug('Remove files from', target);
      fse.remove(target, err => {
        if (err) {
          logger.error("On remove files action", err);
          return reject(err);
        }
        resolve();
      });
    });
  };
};
