'use strict';
const path = require('path');
const fs = require('fs');
const fileExists = require('file-exists');
const log4jsFilePath = path.join(__dirname, "log4js.json");
let config = require(log4jsFilePath);

module.exports = {
  init: () => {
    if (fileExists.sync(log4jsFilePath)) {
      config = require(log4jsFilePath);
      config.categories.default.level = process.env.serverLogLevel || 'debug';
      fs.writeFileSync(log4jsFilePath, JSON.stringify(config, null, 2), function(err) {
      });
    }
  },
  restoreDefaultConfig: () => {
    config.categories.default.level = 'debug';
    fs.writeFileSync(log4jsFilePath, JSON.stringify(config, null, 2), function(err) {
    });
  },
  getLevelField: () => config.categories.default.level
};
