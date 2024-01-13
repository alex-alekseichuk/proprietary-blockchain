'use strict';

const logger = require('log4js').getLogger('ng-fileServer/fileUpload.js');
const fs = require("fs");
const path = require('path');

/**
 * ng-rt-fileServer
 * @type {module}
 * @param {string} originalname - original file name to be processes
 * @param {string} defaultDatabase - default database
 * @param {string} uploadFolder - upload folder
 * @param {string} uploadFolderPath -upload folder path
 * @return {Promise} fileId

 */
const save = (originalname, defaultDatabase, uploadFolder, uploadFolderPath) => {
  return new Promise((resolve, reject) => {
    var file = path.join(uploadFolderPath, uploadFolder, originalname);
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
      storageProvidersService.get('main').storeFile(data, originalname, defaultDatabase).then(fileId => {
        logger.info('File Stored in regrid fileId :', fileId);
        return resolve(fileId);
      }).catch(err => {
        return reject(err);
      });
    });
      // return resolve(fileId);
  });
};
module.exports = {
  save
};
