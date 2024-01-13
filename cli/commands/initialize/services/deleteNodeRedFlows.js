'use strict';
const fs = require('fs-extra');

const logger = require('log4js').getLogger('commands.initialize.services.deleteNodeRedFlows');

module.exports = configService => {
  logger.debug('commands.initialize.services.deleteNodeRedFlows');

  return new Promise(function(resolve, reject) {
    logger.debug('0087 : Cleaning Node-Red Flow Directory : nodered');
    // delete all existing flows in folder
    fs.emptyDir('nodered', function(err) {
      if (!err) {
        logger.debug('0088 : All Node-Red flows in directory deleted');
      }
      return resolve(null);
    });
  });
};
