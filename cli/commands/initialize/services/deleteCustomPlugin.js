'use strict';

const logger = require('log4js').getLogger('commands.initialize.services.deleteCustomPlugin');
const fs = require('fs-extra');

module.exports = configService => {
  logger.debug('commands.initialize.services.deleteCustomPlugin');
  return new Promise(function(resolve, reject) {
    logger.debug('0092 : Cleaning custom Plugins Directory');
    // delete all existing plugins in folder
    let customPlugin = configService.get("additionalPluginsStorages.customPlugins.parameters.folder");
    if (customPlugin && fs.existsSync(customPlugin)) {
      fs.emptyDir(customPlugin, function(err) {
        if (!err) {
          logger.debug('0193 : All custom plugins in directory deleted');
        }
        return resolve(null);
      });
    } else {
      return resolve(null);
    }
  });
};
