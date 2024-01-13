'use strict';
const fs = require('fs-extra');
const logger = require('log4js').getLogger('commands.initialize.services.deletePlugins');

module.exports = configService => {
  logger.debug('commands.initialize.services.deletePlugins');

  return new Promise(function(resolve, reject) {
    logger.debug('0092 : Cleaning Plugins Directory /plugins ');
    // delete all existing plugins in folder
    fs.emptyDir('plugins', function(err) {
      if (!err) {
        logger.debug('0093 : All plugins in directory deleted');
      }
      return resolve(null);
    });
  });
};
