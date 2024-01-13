"use strict";

/* global window, KeysService, utils, CryptoJS, Blob, document */
/* eslint-disable no-use-before-define, no-unused-vars */

let ngAppDc = ngAppDc || {};
ngAppDc.mfs = {
  logger: window.log4js.getLogger('ng-app-documentsSharing-frontend/download/services/makeFileService')
};

/**
 * creates blob based on provided payload, creates <a> element with this element and click it, so user
 * could download document
 * @param {string} root - dom root element of Polymer's element
 * @param {object} data - payload
 * @return {Promise} Promise
 * @ignore
 */
const makeFile = (root, data) => {
  let defaultPair = {
    id: KeysService.getDefault().id,
    key: data.key ? new Uint8Array(utils._base64ToArrayBuffer(data.key)) : null
  };

  if (!data.key) {
    ngAppDc.mfs.logger.debug('no key');
    data.fileInfo.keys.forEach(key => {
      KeysService.getKeys().forEach(localKey => {
        if (key.pubkey === localKey.pubkey) {
          defaultPair.key = new Uint8Array(key.key);
          defaultPair.id = localKey.id;
        }
      });
    });
  }

  let decryptedKey = KeysService.decrypt(defaultPair.id, defaultPair.key);
  let aesKey = utils.typedArrayToUnicodeString(decryptedKey);
  let bytes = CryptoJS.AES.decrypt(utils.convertUint8ArrayToBinaryString(new Uint8Array(data.file)), aesKey);
  let blob = new Blob([new Uint8Array(utils.convertWordArrayToUint8Array(bytes))], {
    type: 'application/octet-stream'
  });
  let a = document.createElement('a');
  a.href = window.URL.createObjectURL(blob);
  a.download = data.fileInfo.filename;
  a.style = 'display: none';
  root.appendChild(a);
  a.click();
  return new Promise(res =>
    setTimeout(() => {
      window.URL.revokeObjectURL(a.href);
      a.remove();
      res();
    }, 1000)
  );
};
