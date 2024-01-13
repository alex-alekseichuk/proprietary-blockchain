'use strict';

/* global _, window, document, config, translate, ajax, project */
/* eslint-disable no-use-before-define, no-unused-vars */

let ngAppDc = ngAppDc || {};
ngAppDc.sfs = {
  logger: window.log4js.getLogger('ng-app-documentsSharing-frontend/app/services/setFileService')
};

/**
 * save file on client side and check file size
 * @param {Object} e - event
 * @param {Object} detail details
 * @param {Object} sender - dom element who has initited action
 * @return {Viod} void value
 * @ignore
 */
const setFile = function(e, detail, sender) {
  let self = this;
  let file = _.head(e.target.files);
  if (!file)
    return;
  let fsz = file.size / 1024 / 1024; // in MB
  if (fsz > config.maxFileSize) {
    document.getElementById('filesnamelabel').firstChild.nodeValue = 'No files selected';
    document.getElementById('fileToShare').value = '';
    return project.toastshow(
      translate('File too large, use file less than') +
      ' ' + config.maxFileSize + ' MB'
    , 'alert');
  }

  self.file = file;
  self.filename = file.name;
  self.filesize = file.size;

  new Promise(res =>
    ajax.post('/ng-app-documentsSharing-backend/nsi/storageByFilesize', {
      fileSize: file.size
    }, res)
  )
    .then(response => {
      if (!response.storage) {
        return project.toast.show(translate("Too large file for saving"), 'alert');
      }
      ngAppDc.sfs.logger.debug("Storage: " + response.storage);
      self.setStorage(response.storage);
    })
    .catch(e => project.toast.show(translate("Can't estimate a storage"), 'alert'));
};
