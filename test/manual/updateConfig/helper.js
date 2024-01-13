'use strict';
const path = require('path');
const configConstants = require('./configConstants').constants;
const configService = require('./configService');
const fs = require('fs');

module.exports = {
  configUpdate: () => {
    let update = [];
    Object.keys(configConstants).forEach(field => {
      // search fields in config which equals fields from constants
      const valueFromConfig = configService.get(field, 'noField');
      if (valueFromConfig === 'noField' || typeof (configConstants[field].processEnv) === 'undefined') {
        return;
      }
      // field autoUpdate is object, but in constants is string
      if (field === 'autoUpdate') {
        const autoUpdField = 'autoUpdate:active';
        if (configConstants.autoUpdate.processEnv === 'true') {
          update.push(configService.add(autoUpdField, true, true));
          return;
        }
        if (configConstants.autoUpdate.processEnv === 'false') {
          update.push(configService.add(autoUpdField, false, true));
          return;
        }
      }
      // just replace this config row with value from constants (which may include process.env)
      if (configConstants[field].processEnv !== valueFromConfig) {
        update.push(configService.add(field, configConstants[field].processEnv, true));
        return;
      }
    });
    return Promise.all(update);
  },
  configGet: field => {
    const valueFromConfig = configService.get(field, 'noField');
    if (valueFromConfig === 'noField') {
      return;
    }
    return valueFromConfig;
  },
  restoreDefaultConfig: () => {
    return new Promise((resolve, reject) => {
      fs.copyFile(path.resolve(__dirname, 'config_original.json'), path.resolve(__dirname, 'config.json'), err => {
        if (err) reject(err);
        resolve();
      });
    });
  }
};
