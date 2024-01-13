(function(){
/**
 * @type {factory}
 * @return {{
 *    unicodeStringToTypedArray: utils.unicodeStringToTypedArray,
 *    makeid: utils.makeid,
 *    convertBinaryStringToUint8Array: utils.convertBinaryStringToUint8Array,
 *    convertUint8ArrayToBinaryString: utils.convertUint8ArrayToBinaryString,
 *    convertWordArrayToUint8Array: utils.convertWordArrayToUint8Array,
 *    typedArrayToUnicodeString: utils.typedArrayToUnicodeString,
 *    _base64ToArrayBuffer: utils._base64ToArrayBuffer
 *    }}
 */
'use strict';

/* global _, window */
/* eslint-disable no-unused-vars */

var _nonce = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4]);

var utils = {
  unicodeStringToTypedArray: function unicodeStringToTypedArray(s) {
    var escstr = encodeURIComponent(s);
    var binstr = escstr.replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode('0x' + p1);
    });
    var ua = new Uint8Array(binstr.length);
    Array.prototype.forEach.call(binstr, function (ch, i) {
      ua[i] = ch.charCodeAt(0);
    });
    return ua;
  },
  makeid: function makeid() {
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return _.chain(new Array(5)).map(function (i) {
      return possible.charAt(Math.floor(Math.random() * possible.length));
    }).join('').value();
  },
  convertBinaryStringToUint8Array: function convertBinaryStringToUint8Array(bStr) {
    return _.map(new Uint8Array(bStr.length), function (el, i) {
      return bStr.charCodeAt(i);
    });
  },
  convertUint8ArrayToBinaryString: function convertUint8ArrayToBinaryString(u8Array) {
    return _.chain(u8Array).map(function (i) {
      return String.fromCharCode(i);
    }).join('').value();
  },
  convertWordArrayToUint8Array: function convertWordArrayToUint8Array(wordArray) {
    var words = wordArray.words;
    var sigBytes = wordArray.sigBytes;
    var u8 = new Uint8Array(sigBytes);
    for (var i = 0; i < sigBytes; i++) {
      var byte = words[i >>> 2] >>> 24 - i % 4 * 8 & 0xff;
      u8[i] = byte;
    }
    return u8;
  },
  typedArrayToUnicodeString: function typedArrayToUnicodeString(ua) {
    return Array.prototype.map.call(ua, function (ch) {
      return String.fromCharCode(ch);
    }).join('');
  },
  _base64ToArrayBuffer: function _base64ToArrayBuffer(base64) {
    var binaryString = window.atob(base64);
    var bytes = new Uint8Array(binaryString.length);

    bytes.forEach(function (el, i) {
      bytes[i] = binaryString.charCodeAt(i);
    });

    return bytes.buffer;
  },
  nonce: function nonce() {
    return _nonce;
  }
};
"use strict";

/* global window, KeysService, utils, CryptoJS, Blob, document */
/* eslint-disable no-use-before-define, no-unused-vars */

var ngAppDc = ngAppDc || {};
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
var makeFile = function makeFile(root, data) {
  var defaultPair = {
    id: KeysService.getDefault().id,
    key: data.key ? new Uint8Array(utils._base64ToArrayBuffer(data.key)) : null
  };

  if (!data.key) {
    ngAppDc.mfs.logger.debug('no key');
    data.fileInfo.keys.forEach(function (key) {
      KeysService.getKeys().forEach(function (localKey) {
        if (key.pubkey === localKey.pubkey) {
          defaultPair.key = new Uint8Array(key.key);
          defaultPair.id = localKey.id;
        }
      });
    });
  }

  var decryptedKey = KeysService.decrypt(defaultPair.id, defaultPair.key);
  var aesKey = utils.typedArrayToUnicodeString(decryptedKey);
  var bytes = CryptoJS.AES.decrypt(utils.convertUint8ArrayToBinaryString(new Uint8Array(data.file)), aesKey);
  var blob = new Blob([new Uint8Array(utils.convertWordArrayToUint8Array(bytes))], {
    type: 'application/octet-stream'
  });
  var a = document.createElement('a');
  a.href = window.URL.createObjectURL(blob);
  a.download = data.fileInfo.filename;
  a.style = 'display: none';
  root.appendChild(a);
  a.click();
  return new Promise(function (res) {
    return setTimeout(function () {
      window.URL.revokeObjectURL(a.href);
      a.remove();
      res();
    }, 1000);
  });
};
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

    self.getMeta().then(function () {
      return self.getSecretSecret();
    }).then(function () {
      if (self.fileMeta.maxBlobDownload && self.fileMeta.maxBlobDownload > self.fileMeta.txPayload.asset.data.fileSize) {
        self.useBlobDownloading = true;
        return self.blobDownloading();
      }
      return self.initFS();
    }).catch(function (err) {
      var toaster = document.getElementById('toaster');
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

  getMeta: function getMeta() {
    var self = this;
    return new Promise(function (resolve, reject) {
      var defKey = KeysService.getDefault();
      if (!defKey) {
        return reject('default key not found');
      }
      ajax.post('/ng-app-documentsSharing-backend/actions/document/meta', {
        id: self.payload.token,
        pubKey: KeysService.getDefault().pubkey
      }, function (data) {
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

  getSecretSecret: function getSecretSecret() {
    this.logger.debug('running getSecretSecret');
    var self = this;
    var contractId = self.fileMeta.txPayload.asset.data.contractId;


    if (!contractId) {
      return new Promise(function (resolve, reject) {
        // let pubKey = self.fileMeta.txPayload.asset.data.keys[0].pubkey;
        var defaultPair = void 0;
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
    return new Promise(function (resolve, reject) {
      self.logger.debug('in promise');
      return ajax.post('/ng-app-documentsSharing-backend/actions/get-federation-nodes', { contractId: contractId }, function (response) {
        var federationNodes = response.federationNodes;

        Promise.all(federationNodes.map(function (federationNodeAddress, index) {
          return new Promise(function (resolve, reject) {
            project.ajax.post('/ng-app-documentsSharing-backend/actions/get-secret-part', {
              pubKey: KeysService.getDefault().pubkey,
              contractId: contractId,
              federationNodeAddress: federationNodeAddress
            }, function (_ref) {
              var keyPart = _ref.keyPart;

              if (keyPart == 'revoked') {
                reject('revoked');
              }
              self.logger.debug('keyPart', keyPart);
              resolve(keyPart);
            });
          });
        })).then(function (keyParts) {
          self.logger.debug('keyParts', keyParts);
          var secretsecret = keyParts.join('');
          self.logger.debug('secretsecret', secretsecret);

          var defaultPair = {
            id: KeysService.getDefault().id,
            key: secretsecret ? new Uint8Array(utils._base64ToArrayBuffer(decodeURIComponent(secretsecret))).slice(0, 80) : null
          };

          self.fileMeta.decryptedKey = KeysService.decrypt(defaultPair.id, defaultPair.key);
          resolve();
        }).catch(reject);
      });
    });
  },

  blobDownloading: function blobDownloading() {
    var self = this;
    return new Promise(function (resolve) {
      self.requestChunk(resolve);
    }).then(function () {
      self.index++;
      if (self.index < self.fileMeta.txPayload.asset.data.blocksCount) {
        return self.blobDownloading();
      }
      self.finishDownloading();
    });
  },

  initFS: function initFS() {
    var self = this;

    var fileSize = 2 * self.fileMeta.txPayload.asset.data.fileSize; // 1024 * 1024 * 1024 * 2;
    if (fileSize < 255) {
      fileSize = 255;
    }
    return new Promise(function (resolve, reject) {
      window.webkitStorageInfo.requestQuota(window.PERSISTENT, fileSize, function (grantedBytes) {
        if (grantedBytes < fileSize) {
          return reject(new Error('Granted bytes [' + grantedBytes + '] less than required storage size [' + fileSize + ']'));
        }

        (window.requestFileSystem || window.webkitRequestFileSystem)(window.PERSISTENT, fileSize, function (fs) {
          self.fs = fs;

          fs.root.getFile(self.resultFileName, { create: true }, function (resultFileEntry) {
            self.resultFileEntry = resultFileEntry;
            resultFileEntry.createWriter(function (resultFileWriter) {
              self.fsWriter = resultFileWriter;

              self.index = 0;

              self.fsWriter.onwriteend = function () {
                self.index++;
                if (self.index < self.fileMeta.txPayload.asset.data.blocksCount) {
                  self.requestChunk();
                  return;
                }
                self.fsWriter = null;
                self.finishDownloading();
                resolve();
              };

              self.fsWriter.onerror = function (err) {
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
    return new Promise(function (resolve, reject) {
      ajax.post('/ng-app-documentsSharing-backend/actions/block/download', {
        fileId: self.fileMeta.txPayload.asset.data.fileId,
        index: index
      }, {
        responseType: 'arraybuffer'
      }, function (data, xhr) {
        if (xhr.status === 200) {
          resolve(data);
        } else {
          reject(data.result);
        }
      });
    }).then(function (data) {
      downloadFile.emit('data', self.index / self.fileMeta.txPayload.asset.data.blocksCount);

      setTimeout(function () {
        var decryptedKey = self.fileMeta.decryptedKey;


        var decrypted = self.fileMeta.txPayload.asset.data.enableEncrypt ? window.keys.symDecrypt(new Uint8Array(data), decryptedKey, utils.nonce()) : data;

        var hash = window.keys.crypto_hash(new Uint8Array(data));

        if (self.fileHash) {
          var newBuffer = new Uint8Array(self.fileHash.length + hash.length);
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
    return new Promise(function (resolve, reject) {
      if (window.keys.bs58_encode(self.fileHash) === self.fileMeta.txPayload.asset.data.fileHash) {
        var finish = function finish(data) {
          var blob = new Blob(data, { type: 'application/octet-stream' });
          downloadFile.emit('data', 1);
          setTimeout(function () {
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
              setTimeout(function () {
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
          self.resultFileEntry.file(function (resultFile) {
            var reader = new FileReader();
            reader.onloadend = function () {
              self.resultFileEntry.remove(function () {
                finish([reader.result]);
              }, reject);
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(resultFile);
          }, reject);
        }
      } else {
        self.resultFileEntry.remove(function () {
          reject('Invalid file hash');
        }, reject);
      }
    }).then(function () {
      var data = (self.fileMeta || {}).txPayload || {};
      var filename = data.asset.data.filename;
      var sendername = data.asset.data.username;
      self.logger.debug('filename = ' + filename + ', sendername = ' + sendername);
      emitters.documentsSharing.fileDownload.emit('downloadFinished', { filename: filename, sendername: sendername });
    }).catch(function (err) {
      var toaster = document.getElementById('toaster');
      toaster.show(err, 'alert');
      self.invalidHashAnim();
    });
  },

  makeFile: makeFile,

  startDownloadAnim: function startDownloadAnim() {
    document.getElementById("downloaddialog").classList.remove("finished");
    document.getElementById("downloaddialog").classList.add("started");
  },
  stopDownloadAnim: function stopDownloadAnim() {
    // End animation
    document.getElementById("downloaddialog").classList.remove("started");
    document.getElementById("downloaddialog").classList.add("finished");
  },
  accessDeniedAnim: function accessDeniedAnim() {
    document.getElementById("downloaddialog").classList.remove("started");
    document.getElementById("downloaddialog").classList.remove("finished");
    document.getElementById("downloaddialog").classList.add("denied");
  },
  invalidHashAnim: function invalidHashAnim() {
    document.getElementById("downloaddialog").classList.remove("started");
    document.getElementById("downloaddialog").classList.remove("finished");
    document.getElementById("downloaddialog").classList.add("invalid_hash");
  },
  expiredAnim: function expiredAnim() {
    document.getElementById("downloaddialog").classList.remove("started");
    document.getElementById("downloaddialog").classList.remove("finished");
    document.getElementById("downloaddialog").classList.add("expired");
  },
  errorAnim: function errorAnim() {
    document.getElementById("downloaddialog").classList.remove("started");
    document.getElementById("downloaddialog").classList.remove("finished");
    document.getElementById("downloaddialog").classList.add("error");
  },
  noKeysAnim: function noKeysAnim() {
    document.getElementById("downloaddialog").classList.remove("started");
    document.getElementById("downloaddialog").classList.remove("finished");
    document.getElementById("downloaddialog").classList.add("nokeys");
  }
});
}).call(this);