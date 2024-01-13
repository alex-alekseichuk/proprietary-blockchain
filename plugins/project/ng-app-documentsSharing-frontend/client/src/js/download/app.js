"use strict";

/* global window, document, Polymer, project, KeysService, ajax, utils, downloadFile, Blob, FileReader, emitters, makeFile */
/* eslint-disable new-cap */

Polymer({
  is: "ng-app-downloadShared",
  properties: {
    payload: {
      type: Object
    }
  },
  fs: null,
  fsWriter: null,
  resultFileName: 'result',
  resultFileEntry: null,
  fileInfo: null,
  fileMeta: null,
  fileRawBlob: [],
  useBlobDownloading: false,
  index: 0,
  attached: function attached() {
    var self = this;
    self.logger = window.log4js.getLogger('ng-app-documentsSharing-frontend/download/app');

    self.startDownloadAnim();

    self.getMeta()
      .then(() => {
        return self.getSecretSecret();
      })
      .then(function() {
        if (self.fileMeta.maxBlobDownload && self.fileMeta.maxBlobDownload > self.fileMeta.txPayload.asset.data.fileSize) {
          self.useBlobDownloading = true;
          return self.blobDownloading();
        }
        return self.initFS();
      })
      .catch(function(err) {
        const toaster = document.getElementById('toaster');
        if (err === 'accessDenied') {
          toaster.show('The file does not belong to the current user', 'alert');
          self.accessDeniedAnim();
        } else if (err === 'Download time expired' || err === 'revoked') {
          self.expiredAnim();
          toaster.show('Download time expired', 'alert');
        } else if (err === 'default key not found') {
          self.noKeysAnim();
          toaster.show('This browser doesn\'t have right key', 'alert');
        } else {
          self.logger.error(JSON.stringify(err));
          toaster.show('Unknown error', 'alert');
          self.errorAnim();
        }
      });
  },

  getMeta: function() {
    const self = this;
    return new Promise(function(resolve, reject) {
      let defKey = KeysService.getDefault();
      if (!defKey) {
        return reject('default key not found');
      }
      ajax.post('/ng-app-documentsSharing-backend/actions/document/meta', {
        id: self.payload.token,
        pubKey: KeysService.getDefault().pubkey
      }, function(data) {
        if (data.variant === "ERROR") {
          reject(data.result);
        } else {
          self.logger.debug('meta saved successfully');
          self.fileMeta = data;
          resolve();
        }
      });
    });
  },

  getSecretSecret: function() {
    this.logger.debug('running getSecretSecret');
    const self = this;
    const {contractId} = self.fileMeta.txPayload.asset.data;

    if (!contractId) {
      return new Promise(function(resolve, reject) {
        // let pubKey = self.fileMeta.txPayload.asset.data.keys[0].pubkey;
        let defaultPair;
        if (KeysService.getDefault().pubkey) {
          defaultPair = {
            key: new Uint8Array(self.fileMeta.txPayload.asset.data.keys[0].key),
            id: KeysService.getDefault().id
          };
        }
        self.fileMeta.decryptedKey = KeysService.decrypt(defaultPair.id, defaultPair.key);
        resolve();
      });
    }
    return new Promise(function(resolve, reject) {
      self.logger.debug('in promise');
      return ajax.post('/ng-app-documentsSharing-backend/actions/get-federation-nodes', {contractId}, response => {
        const {federationNodes} = response;
        Promise.all(federationNodes.map((federationNodeAddress, index) => {
          return new Promise((resolve, reject) => {
            project.ajax.post('/ng-app-documentsSharing-backend/actions/get-secret-part', {
              pubKey: KeysService.getDefault().pubkey,
              contractId,
              federationNodeAddress
            }, ({keyPart}) => {
              if (keyPart == 'revoked') {
                reject('revoked');
              }
              self.logger.debug('keyPart', keyPart);
              resolve(keyPart);
            });
          });
        }))
            .then(keyParts => {
              self.logger.debug('keyParts', keyParts);
              const secretsecret = keyParts.join('');
              self.logger.debug('secretsecret', secretsecret);

              const defaultPair = {
                id: KeysService.getDefault().id,
                key: secretsecret ? new Uint8Array(utils._base64ToArrayBuffer(decodeURIComponent(secretsecret))).slice(0, 80) : null
              };

              self.fileMeta.decryptedKey = KeysService.decrypt(defaultPair.id, defaultPair.key);
              resolve();
            })
            .catch(reject);
      });
    });
  },

  blobDownloading: function() {
    var self = this;
    return new Promise(function(resolve) {
      self.requestChunk(resolve);
    }).then(function() {
      self.index++;
      if (self.index < self.fileMeta.txPayload.asset.data.blocksCount) {
        return self.blobDownloading();
      }
      self.finishDownloading();
    });
  },

  initFS: function() {
    var self = this;

    var fileSize = 2 * self.fileMeta.txPayload.asset.data.fileSize; // 1024 * 1024 * 1024 * 2;
    if (fileSize < 255) {
      fileSize = 255;
    }
    return new Promise(function(resolve, reject) {
      window.webkitStorageInfo.requestQuota(window.PERSISTENT, fileSize, function(grantedBytes) {
        if (grantedBytes < fileSize) {
          return reject(new Error('Granted bytes [' + grantedBytes +
            '] less than required storage size [' + fileSize + ']'));
        }

        (window.requestFileSystem || window.webkitRequestFileSystem)(window.PERSISTENT, fileSize, function(fs) {
          self.fs = fs;

          fs.root.getFile(self.resultFileName, {create: true}, function(resultFileEntry) {
            self.resultFileEntry = resultFileEntry;
            resultFileEntry.createWriter(function(resultFileWriter) {
              self.fsWriter = resultFileWriter;

              self.index = 0;

              self.fsWriter.onwriteend = function() {
                self.index++;
                if (self.index < self.fileMeta.txPayload.asset.data.blocksCount) {
                  self.requestChunk();
                  return;
                }
                self.fsWriter = null;
                self.finishDownloading();
                resolve();
              };

              self.fsWriter.onerror = function(err) {
                reject(err);
              };

              self.requestChunk();
            }, reject);
          }, reject);
        }, reject);
      }, reject);
    });
  },

  requestChunk: function requestChunk(cb) {
    var self = this;
    var index = self.index;
    self.logger.debug('Try to request chunk fileId: ' + self.fileMeta.txPayload.asset.data.fileId + ', index: ' + index);
    return new Promise(function(resolve, reject) {
      ajax.post('/ng-app-documentsSharing-backend/actions/block/download', {
        fileId: self.fileMeta.txPayload.asset.data.fileId,
        index: index
      }, {
        responseType: 'arraybuffer'
      }, function(data, xhr) {
        if (xhr.status === 200) {
          resolve(data);
        } else {
          reject(data.result);
        }
      });
    }).then(function(data) {
      downloadFile.emit('data', self.index / self.fileMeta.txPayload.asset.data.blocksCount);

      setTimeout(function() {
        const {decryptedKey} = self.fileMeta;

        const decrypted = self.fileMeta.txPayload.asset.data.enableEncrypt ?
          window.keys.symDecrypt(new Uint8Array(data), decryptedKey, utils.nonce()) :
          data;

        let hash = window.keys.crypto_hash(new Uint8Array(data));

        if (self.fileHash) {
          let newBuffer = new Uint8Array(self.fileHash.length + hash.length);
          newBuffer.set(self.fileHash);
          newBuffer.set(hash, self.fileHash.length);
          self.fileHash = window.keys.crypto_hash(newBuffer);
        } else {
          self.fileHash = hash;
        }

        if (self.useBlobDownloading) {
          self.fileRawBlob.push(decrypted);
          if (cb) {
            cb();
          }
        } else {
          var blob = new Blob([decrypted], {
            type: 'application/octet-stream'
          });

          self.fsWriter.write(blob);
        }
      }, 500);
    });
  },

  finishDownloading: function finishDownloading() {
    var self = this;
    return new Promise(function(resolve, reject) {
      if (window.keys.bs58_encode(self.fileHash) === self.fileMeta.txPayload.asset.data.fileHash) {
        var finish = function(data) {
          var blob = new Blob(data, {type: 'application/octet-stream'});
          downloadFile.emit('data', 1);
          setTimeout(function() {
            if (window.navigator.msSaveBlob) {
              window.navigator.msSaveBlob(blob, self.fileMeta.txPayload.asset.data.filename);
              self.stopDownloadAnim();
            } else {
              var a = document.createElement('a');
              a.href = window.URL.createObjectURL(blob);
              a.download = self.fileMeta.txPayload.asset.data.filename;
              a.style.display = 'none';
              Polymer.dom(self.root).appendChild(a);
              a.click();
              self.stopDownloadAnim();
              setTimeout(function() {
                window.URL.revokeObjectURL(a.href);
                a.remove();
                resolve();
              }, 1000);
            }
          }, 500);
        };
        if (self.useBlobDownloading) {
          finish(self.fileRawBlob);
        } else {
          self.resultFileEntry.file(function(resultFile) {
            var reader = new FileReader();
            reader.onloadend = function() {
              self.resultFileEntry.remove(function() {
                finish([reader.result]);
              }, reject);
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(resultFile);
          }, reject);
        }
      } else {
        self.resultFileEntry.remove(function() {
          reject('Invalid file hash');
        }, reject);
      }
    })
      .then(() => {
        const data = (self.fileMeta || {}).txPayload || {};
        const filename = data.asset.data.filename;
        const sendername = data.asset.data.username;
        self.logger.debug('filename = ' + filename + ', sendername = ' + sendername);
        emitters.documentsSharing.fileDownload.emit('downloadFinished', {filename, sendername});
      })
      .catch(err => {
        const toaster = document.getElementById('toaster');
        toaster.show(err, 'alert');
        self.invalidHashAnim();
      });
  },

  makeFile: makeFile,

  startDownloadAnim: function() {
    document.getElementById("downloaddialog").classList.remove("finished");
    document.getElementById("downloaddialog").classList.add("started");
  },
  stopDownloadAnim: function() {
    // End animation
    document.getElementById("downloaddialog").classList.remove("started");
    document.getElementById("downloaddialog").classList.add("finished");
  },
  accessDeniedAnim: function() {
    document.getElementById("downloaddialog").classList.remove("started");
    document.getElementById("downloaddialog").classList.remove("finished");
    document.getElementById("downloaddialog").classList.add("denied");
  },
  invalidHashAnim: function() {
    document.getElementById("downloaddialog").classList.remove("started");
    document.getElementById("downloaddialog").classList.remove("finished");
    document.getElementById("downloaddialog").classList.add("invalid_hash");
  },
  expiredAnim: function() {
    document.getElementById("downloaddialog").classList.remove("started");
    document.getElementById("downloaddialog").classList.remove("finished");
    document.getElementById("downloaddialog").classList.add("expired");
  },
  errorAnim: function() {
    document.getElementById("downloaddialog").classList.remove("started");
    document.getElementById("downloaddialog").classList.remove("finished");
    document.getElementById("downloaddialog").classList.add("error");
  },
  noKeysAnim: function() {
    document.getElementById("downloaddialog").classList.remove("started");
    document.getElementById("downloaddialog").classList.remove("finished");
    document.getElementById("downloaddialog").classList.add("nokeys");
  }
});
