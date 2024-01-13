"use strict";

/**
 * get storage provider based on size of file
 */

/**
 * @type {service}
 * @param {Object} models - model's instance
 * @param {Number} fileSize - size of file
 * @return {Object} observer
 */
module.exports = (models, fileSize) => {
  return models.uiObserver.notifyObserversOf("DS_get_storage_by_filesize", {fileSize: fileSize});
};
