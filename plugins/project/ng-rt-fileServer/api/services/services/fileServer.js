'use strict';

const logger = require('log4js').getLogger('ng-rt-filesServer-routes');
const fileUpload = require('../../../server/uploadService');
let defaultDatabase;
let pluginManager;
let pluginSettings;
let uploadFolder;
let uploadFolderPath;

    /**
     *
     * @param {array} files array of file
     * @return {object} result with fileId
     */
const postUpload = async files => {
  try {
    logger.debug('files : ' + JSON.stringify(files));
    logger.debug('# of files : ' + files.length);

    for (var x = 0; x < files.length; x++) {
      logger.debug('Originalname :', files[x].originalname);
      let originalname = files[x].originalname;
      let fileLength = files.length;

      const fileId = await fileUpload.save(originalname, defaultDatabase, uploadFolder, uploadFolderPath);
      return ({
        status: "Done",
        file: originalname,
        files: x,
        total: fileLength,
        fileId: fileId
      });
    }
  } catch (error) {
    logger.error(error);
  }
};

const getDownload = async id => {
  try {
    let storageProvidersService = global.serviceManager.get('storageProviders');
    let result = await storageProvidersService.get('main').getFile(id);
    let file = result.file;
    return file;
  } catch (error) {
    logger.error(error);
  }
};

module.exports = services => {
  pluginManager = services.get('loopbackApp').plugin_manager;
  pluginSettings = pluginManager.configs.get('ng-rt-fileServer');
  uploadFolder = pluginSettings.get('uploadFolder');
  uploadFolderPath = pluginManager.configs.data('ng-rt-fileServer').path.relative;
  defaultDatabase = pluginManager.services.get('configService').get('databaseType');

  return {
    postUpload,
    getDownload
  };
};
