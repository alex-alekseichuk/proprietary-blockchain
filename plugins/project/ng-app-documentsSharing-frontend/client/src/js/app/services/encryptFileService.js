'use strict';

/* global window, _, KeysService, FileReader, ajax, translate, utils, project */
/* eslint-disable no-use-before-define, no-unused-vars */

let ngAppDc = ngAppDc || {};
ngAppDc.efs = {
  logger: window.log4js.getLogger('ng-app-documentsSharing-frontend/app/services/encryptFileService')
};

/**
 * encrypts file
 * @param {Object} data - is an array of pubKey: user_pubkey
 * @return {Object} Promise
 * @ignore
 */
const generateKey = function(data) {
  return new Promise(res => {
    const key = window.keys.symKey();
    let keys = _.map(data, item => {
      const encrypt = KeysService.encryptByKey(item.pubKey, key);
      return {
        email: item.email,
        key: _.values(encrypt),
        pubkey: item.pubKey,
        admin: item.admin
      };
    });
    res({
      key: key,
      keys: keys
    });
  });
};

const blockSize = 4 * 1024 * 1024;

const _encryptAndUploadBlocks = function(key, file, fileSize, n, index, fileId, encrypt, self) {
  window.uploadFile.emit('data', index / n);

  return new Promise((res, rej) => {
    const reader = new FileReader();

    reader.onload = event => {
      const content = event.target.result;

      const encrypted = encrypt ? window.keys.symEncrypt(new Uint8Array(content), key, utils.nonce()) : content;

      const headers = {index: index, filesize: fileSize};

      let hash = window.keys.crypto_hash(new Uint8Array(encrypted));

      if (self.fileHash) {
        let newBuffer = new Uint8Array(self.fileHash.length + hash.length);
        newBuffer.set(self.fileHash);
        newBuffer.set(hash, self.fileHash.length);
        self.fileHash = window.keys.crypto_hash(newBuffer);
      } else {
        self.fileHash = hash;
      }

      if (fileId) {
        headers.fileId = fileId;
      }

      ajax.rawUpload('/ng-app-documentsSharing-backend/upload', encrypted, headers, (result, xhr) => {
        index++;

        if (!result) {
          if (xhr.response && xhr.response.err) {
            return rej(xhr.response.err);
          }
          return rej();
        }

        if (!fileId) {
          fileId = result.fileId;
        }

        if (index >= n) {
          res(fileId);
        } else {
          _encryptAndUploadBlocks(key, file, fileSize, n, index, fileId, encrypt, self).then(res);
        }
      });
    };

    const offset = index * blockSize;
    let last = offset + blockSize;

    if (last > fileSize) {
      last = fileSize;
    }

    ngAppDc.efs.logger.trace('read ' + index + ' ' + offset + ' ' + last);

    reader.readAsArrayBuffer(file.slice(offset, last));
  });
};

const encryptAndUploadFile = function(data) {
  let self = this;

  // check if file is selected
  return new Promise((res, rej) =>
    self.file ? res() : rej(translate("No file selected!"))
  )
  .then(() => {
    let key = data.key;
    let keys = data.keys;

    // calculate number of blocks
    let nBlocks = Math.floor(self.filesize / blockSize);

    if (nBlocks * blockSize < self.filesize) {
      nBlocks++;
    }

    ngAppDc.efs.logger.trace('size: ' + self.filesize + ' blocks: ' + nBlocks);

    return _encryptAndUploadBlocks(key, self.file, self.filesize, nBlocks, 0, null, self.enableEncrypt, self)
      .then(fileId => {
        delete self.file;
        ngAppDc.efs.logger.debug('read all ' + fileId);
        return Promise.resolve({
          fileId: fileId,
          fileName: self.filename,
          fileSize: self.filesize,
          blockSize: blockSize,
          blocksCount: nBlocks,
          storeType: self.$.storageType.selectedItem.id,
          keys: keys,
          project_id: self.project_id,
          username: _.get(window.config, 'user.username', ''),
          enableEncrypt: self.enableEncrypt,
          fileHash: window.keys.bs58_encode(self.fileHash)
        });
      })
      .catch(err => {
        return Promise.reject(err);
      });
  })
  .catch(err => {
    return Promise.reject(err);
  });
};

const encryptFile = function(data) {
  let self = this;

  return new Promise((res, rej) =>
    self.file ? res() :
      rej(translate("No file selected!"))
  )
    .then(() => {
      return new Promise(res => {
        let key = data.key;
        let keys = data.keys;

        let reader = new FileReader();
        reader.onload = function() {
          res({
            payload: this.result,
            fileName: self.filename,
            storeType: self.$.storageType.selectedItem.id,
            keys: keys,
            project_id: self.project_id,
            username: _.get(window.config, 'user.username', '')
          });
        };
        reader.readAsArrayBuffer(self.file);
        delete self.file;
      });
    })
    .catch(err => {
      self.stopCopyAnim();
      project.toast.show(err, 'alert');
    });
};
