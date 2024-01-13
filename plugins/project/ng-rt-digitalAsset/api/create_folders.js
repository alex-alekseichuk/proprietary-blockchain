/* eslint-disable no-undef */

'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('create_folders.js');
const path = require('path');
const fs = require('fs-extra');

logger.debug('create_folders.js');

const uploadFolderPath = server.plugin_manager.configs.data('ng-rt-fileServer').path.relative;

createFolder(path.join(uploadFolderPath, 'uploads'));
createFolder(path.join(uploadFolderPath, 'downloads'));
/**
 *
 * @param {object} folder - folder parameter for folder creation
 * @private
 */
function createFolder(folder) {
  try {
    fs.lstatSync(folder);
  } catch (e) {
    fs.mkdirSync(folder);
  }
}
