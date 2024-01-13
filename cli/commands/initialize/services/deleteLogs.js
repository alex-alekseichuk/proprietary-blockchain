'use strict';

const fs = require('fs-extra');
const logger = require('log4js').getLogger('commands.initialize.services.deleteLogs');

module.exports = configService => {
  logger.debug('commands.initialize.services.deleteLogs');

  return new Promise(function(resolve, reject) {
    logger.debug('0087 : Cleaning Logging Directory : log');
    // delete all existing logs in folder
    fs.emptyDir('log', function(err) {
      if (!err) {
        logger.debug('0088 : All Logs in directory deleted');
      }
      return resolve(null);
    });
  });
};
