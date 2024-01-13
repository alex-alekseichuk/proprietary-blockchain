'use strict';

const logger = require('log4js').getLogger('ng-fileServer/fileUpload.js');
const fs = require("fs");
// const uuid = require('uuid');
const path = require('path');

/**
 * ng-rt-fileServer
 * @type {module}
 * @param fileName - file name to be processes
 * @param server - server's instance to register routes
 */

module.exports = () => {
  return {
    save: (server, plugin, fileName, storageName) => {
      return new Promise((resolve, reject) => {
        logger.debug("New file arrived here: " + fileName + ' to storage' + storageName);
        const settings = server.plugin_manager.configs.get(plugin);
        const uploadFolder = settings.get('uploadFolder');
        const uploadFolderPath = server.plugin_manager.configs.data(plugin).path.relative;
        // var id = uuid.v4();
        var file = path.join(uploadFolderPath, uploadFolder, fileName);
        logger.debug('File : ', file);
        fs.readFile(file, function(err, data) {
          if (err) {
            logger.error('Error loading from filesystem');
            return reject(err);
          }
          var storageProvidersService = global.serviceManager.get('storageProviders');
          logger.trace(data);
          logger.trace('Loaded file from filesystem');
          logger.trace('Encrypted file. Saving file to REGRID');
          storageProvidersService.get('main').storeFile(data, fileName, storageName).then(fileId => {
            logger.info('File Stored in regrid fileId :', fileId);
            return resolve(fileId);
          }).catch(err => {
            return reject(err);
          });
        });
        // return resolve(fileId);
      });
    }
  };
};
