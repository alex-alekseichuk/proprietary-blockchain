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
'use strict';

/* global window, _, KeysService, FileReader, ajax, translate, utils, project */
/* eslint-disable no-use-before-define, no-unused-vars */

var ngAppDc = ngAppDc || {};
ngAppDc.efs = {
  logger: window.log4js.getLogger('ng-app-documentsSharing-frontend/app/services/encryptFileService')
};

/**
 * encrypts file
 * @param {Object} data - is an array of pubKey: user_pubkey
 * @return {Object} Promise
 * @ignore
 */
var generateKey = function generateKey(data) {
  return new Promise(function (res) {
    var key = window.keys.symKey();
    var keys = _.map(data, function (item) {
      var encrypt = KeysService.encryptByKey(item.pubKey, key);
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

var blockSize = 4 * 1024 * 1024;

var _encryptAndUploadBlocks = function _encryptAndUploadBlocks(key, file, fileSize, n, index, fileId, encrypt, self) {
  window.uploadFile.emit('data', index / n);

  return new Promise(function (res, rej) {
    var reader = new FileReader();

    reader.onload = function (event) {
      var content = event.target.result;

      var encrypted = encrypt ? window.keys.symEncrypt(new Uint8Array(content), key, utils.nonce()) : content;

      var headers = { index: index, filesize: fileSize };

      var hash = window.keys.crypto_hash(new Uint8Array(encrypted));

      if (self.fileHash) {
        var newBuffer = new Uint8Array(self.fileHash.length + hash.length);
        newBuffer.set(self.fileHash);
        newBuffer.set(hash, self.fileHash.length);
        self.fileHash = window.keys.crypto_hash(newBuffer);
      } else {
        self.fileHash = hash;
      }

      if (fileId) {
        headers.fileId = fileId;
      }

      ajax.rawUpload('/ng-app-documentsSharing-backend/upload', encrypted, headers, function (result, xhr) {
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

    var offset = index * blockSize;
    var last = offset + blockSize;

    if (last > fileSize) {
      last = fileSize;
    }

    ngAppDc.efs.logger.trace('read ' + index + ' ' + offset + ' ' + last);

    reader.readAsArrayBuffer(file.slice(offset, last));
  });
};

var encryptAndUploadFile = function encryptAndUploadFile(data) {
  var self = this;

  // check if file is selected
  return new Promise(function (res, rej) {
    return self.file ? res() : rej(translate("No file selected!"));
  }).then(function () {
    var key = data.key;
    var keys = data.keys;

    // calculate number of blocks
    var nBlocks = Math.floor(self.filesize / blockSize);

    if (nBlocks * blockSize < self.filesize) {
      nBlocks++;
    }

    ngAppDc.efs.logger.trace('size: ' + self.filesize + ' blocks: ' + nBlocks);

    return _encryptAndUploadBlocks(key, self.file, self.filesize, nBlocks, 0, null, self.enableEncrypt, self).then(function (fileId) {
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
    }).catch(function (err) {
      return Promise.reject(err);
    });
  }).catch(function (err) {
    return Promise.reject(err);
  });
};

var encryptFile = function encryptFile(data) {
  var self = this;

  return new Promise(function (res, rej) {
    return self.file ? res() : rej(translate("No file selected!"));
  }).then(function () {
    return new Promise(function (res) {
      var key = data.key;
      var keys = data.keys;

      var reader = new FileReader();
      reader.onload = function () {
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
  }).catch(function (err) {
    self.stopCopyAnim();
    project.toast.show(err, 'alert');
  });
};
'use strict';

/* global _, window, document, config, translate, ajax, project */
/* eslint-disable no-use-before-define, no-unused-vars */

var ngAppDc = ngAppDc || {};
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
var setFile = function setFile(e, detail, sender) {
  var self = this;
  var file = _.head(e.target.files);
  if (!file) return;
  var fsz = file.size / 1024 / 1024; // in MB
  if (fsz > config.maxFileSize) {
    document.getElementById('filesnamelabel').firstChild.nodeValue = 'No files selected';
    document.getElementById('fileToShare').value = '';
    return project.toastshow(translate('File too large, use file less than') + ' ' + config.maxFileSize + ' MB', 'alert');
  }

  self.file = file;
  self.filename = file.name;
  self.filesize = file.size;

  new Promise(function (res) {
    return ajax.post('/ng-app-documentsSharing-backend/nsi/storageByFilesize', {
      fileSize: file.size
    }, res);
  }).then(function (response) {
    if (!response.storage) {
      return project.toast.show(translate("Too large file for saving"), 'alert');
    }
    ngAppDc.sfs.logger.debug("Storage: " + response.storage);
    self.setStorage(response.storage);
  }).catch(function (e) {
    return project.toast.show(translate("Can't estimate a storage"), 'alert');
  });
};
"use strict";

/* eslint-disable no-unused-vars */

/**
 * return provider based on provided name
 * @param {String} storageName - provider's name
 * @ignore
 */

var setStorage = function setStorage(storageName) {
  this.storageName = storageName;
  this.$.lstStorages.selected = (this.providers || []).indexOf(storageName);
};
'use strict';

/* global window, pajax, moment, atob, document, _, ajax, localStorage, setFile, setStorage, translate, I18nMsg, opr */
/* global navigator, InstallTrigger, encryptAndUploadFile, Polymer, generateKey, EventEmitter2 */
/* eslint-disable no-nested-ternary, new-cap, no-undef */
/* eslint-disable complexity */
/* eslint-disable */

var component = {
  is: "ng-app-documentsSharing",
  properties: {
    recipients: {
      type: "array",
      value: []
    },
    contracts: {
      type: "array",
      value: ["None", "1 minute expiration"]
    },
    contacts: {
      type: "array",
      value: []
    },
    sharingTab: {
      type: String,
      value: "0"
    },
    projects: {
      type: "array",
      value: []
    },
    hideinbox: {
      type: Boolean,
      value: true
    },
    inboxDB: {
      type: Array,
      value: []
    },
    additionalMsg: {
      type: String,
      value: ""
    }
  },
  ready: function ready() {
    var _this = this;

    // Logger
    this.logger = window.log4js.getLogger('ng-app-documentsSharing-frontend/app/app');
    this.logger.debug('DocumentsSharing ready!');
    return this.getEmailSend().then(function (res) {
      return pajax.get('/ng-app-documentsSharing-backend/settings');
    }).then(function (res) {
      if (!res.success) throw new Error('get settings without success');
      _this.logger.trace('get settings = ' + JSON.stringify(res));
      _this.hideinbox = (res.settings || {}).hideinbox;
      return _this.hideinbox;
    }).catch(function (err) {
      _this.logger.error('get settings error = ' + JSON.stringify(err));
    });
  },

  hideToStyle: function hideToStyle(hide) {
    if (hide) return 'medium;';else if (!hide) return 'medium-tall';
  },
  ActiveTabCheck: function ActiveTabCheck(index, selected) {
    return index == selected;
  },
  getEmailSend: function getEmailSend() {
    var _this2 = this;

    return pajax.get('/ng-app-documentsSharing-backend/emailSend').then(function (ret) {
      if (!ret.success) {
        _this2.inboxDB = [];
        return _this2.inboxDB;
      }
      if (!Array.isArray(ret.emails)) throw new Error('emails not array');
      ret.emails.forEach(function (email) {
        // if (!email.date) email.date = new Date();
        if (!email.date) email.date = '';
        if (email.date) email.date = moment(email.date).format('DD.MM.YY HH:mm');
        // email.seen = Math.random() > 0.5 ? 'Not seen' : 'Seen';
        var userEmail = JSON.parse(atob(localStorage.session_token.split('.')[1])).email;
        email.seen = email.payload.expiration !== 'never' && Date.parse(email.payload.expiration) < Date.parse(new Date()) ? 'Expired' : (email.payload.seen || []).indexOf(userEmail) === -1 ? 'Not seen' : 'Seen';
      });
      _this2.inboxDB = ret.emails;
    }).catch(function (err) {
      _this2.logger.error('get emailSend error = ' + JSON.stringify(err));
      _this2.inboxDB = [];
    });
  },

  emailClick: function emailClick(ev) {
    var _this3 = this;

    this.logger.trace('emailClick = ' + ev);

    var item = (ev.model || {}).item || {};
    var id = item.id;
    var href = (item.payload || {}).href;

    this.logger.debug('email id = ' + id);
    this.logger.debug('email href = ' + href);

    if (item.payload.expiration === 'never' || Date.parse(item.payload.expiration) >= Date.parse(new Date())) {
      var a = document.createElement('a');

      a.href = href;

      if (!href) {
        return this.logger.debug('cant download, no href');
      }

      window.location.href = a.pathname + a.search;

      return pajax.post('/ng-app-documentsSharing-backend/emailSeen', { id: id }).catch(function (err) {
        return _this3.logger.error('post emailSeen error = ' + JSON.stringify(err));
      }).then(function (ret) {
        _this3.logger.trace('post emailSeen ret = ' + JSON.stringify(ret));
        return _this3.getEmailSend();
      });
    }
  },

  toggleEncrypt: function toggleEncrypt() {
    this.enableEncrypt = !this.enableEncrypt;
  },

  contactBookListener: function contactBookListener() {
    var self = this;
    self.$.components_contact_book.addEventListener('acceptSelected', function (ev) {
      self.set('recipients', []);
      self.$.components_contact_book.ready();
      _.chain(ev.detail.selectedEmails).forEach(function (email) {
        if (!_.find(self.recipients, { pubKey: email })) {
          self.push('recipients', {
            pubKey: email
          });
        }
      }).value();
    });
  },
  addRecipient: function addRecipient() {
    var self = this;
    self.push('recipients', {
      pubKey: ""
    });
  },
  displayIndex: function displayIndex(index) {
    return index + 1;
  },
  removeRecepient: function removeRecepient(event) {
    var self = this;
    self.splice("recipients", event.model.index, 1);
  },
  attached: function attached() {
    var self = this;
    I18nMsg.url = '/ng-app-documentsSharing-frontend/locales'; // optionally use custom folder for locales.
    // Platform.performMicrotaskCheckpoint();
    self.contactBookListener();

    self.enableEncrypt = true;

    Promise.all([new Promise(function (res) {
      return ajax.get('/ng-app-documentsSharing-backend/nsi/providers', res);
    }), new Promise(function (res) {
      return ajax.get('/user-profile', 'ng-rt-jwt-auth', res);
    }), new Promise(function (res) {
      return ajax.get('/ng-rt-components-backend/contacts', {}, res);
    }), new Promise(function (res) {
      return ajax.get('/ng-app-documentsSharing-backend/projects', {}, res);
    })]).then(function (data) {
      self.providers = data[0];
      self.setStorage('rethinkdb');
      self.$.storageType.disabled = !data[1].advanced;
      self.$.storageSection.hidden = !data[1].advanced;
      self.$.enableEncrypt.hidden = !data[1].advanced;
      self.contacts = _.chain(data[2].contacts).map(function (c) {
        return c.email;
      }).value();
      self.projects = data[3] || [];
      if (self.recipients.length == 0) self.addRecipient();
    });
  },
  isChrome: function isChrome() {
    var browser = function browser() {
      // Return cached result if avalible, else get result then cache it.
      if (browser.prototype._cachedResult) return browser.prototype._cachedResult;

      // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
      var isOpera = Boolean(window.opr) && Boolean(opr.addons) || Boolean(window.opera) || navigator.userAgent.indexOf(' OPR/') >= 0;

      // Firefox 1.0+
      var isFirefox = typeof InstallTrigger !== 'undefined';

      // At least Safari 3+: "[object HTMLElementConstructor]"
      var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;

      // Chrome 1+
      var isChrome = Boolean(window.chrome) && !isOpera;

      // At least IE6
      var isIE = /* @cc_on!@*/false || Boolean(document.documentMode);

      // Edge 20+
      var isEdge = !isIE && Boolean(window.StyleMedia);

      browser.prototype._cachedResult = isOpera ? 'Opera1' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : isChrome ? 'Chrome' : isIE ? 'IE' : isEdge ? 'Edge' : "Don't know";
      return browser.prototype._cachedResult;
    };

    if (browser() != "Chrome") return true;
    return false;
  },
  // get content of selected file
  setFile: setFile,
  setStorage: setStorage,
  onSubmit: async function onSubmit() {
    var _this4 = this;

    var self = this;
    new Promise(function (resolve, reject) {
      if (!self.recipients || self.recipients.length == 0) return reject(translate('Select recipients!'));
      if (!document.getElementById('fileToShare').value) return reject(translate('Select file!'));
      resolve();
    }).then(function () {
      return _.chain(self.recipients).filter(function (r) {
        return _.isEmpty(r.pubKey);
      }) // check all recipients have pubKey
      .isEmpty().value() ? Promise.resolve() : Promise.reject(translate("Error in recipients"));
    }).then(function () {
      _this4.startCopyAnim();
      return new Promise(function (res) {
        ajax.post('/ng-app-documentsSharing-backend/nsi/emailsAndPubkeys', {
          recipients: self.$.recipients.items
        }, res);
      });
    }).then(function (result) {
      if ((result.unknown_emails || []).length) {
        return Promise.reject(translate('Unknown emails: ') + result.unknown_emails.join(', '));
      } else if (result.variant == "OK") {
        return self.generateKey(result.result);
      }
      return Promise.reject(translate("User with such public key not found!"));
    }).then(function (result) {
      return self.encryptAndUploadFile(result);
    }).then(function (body) {
      var spaEngine = document.querySelector('#documentsSharing');

      body.additionalMsg = self.additionalMsg;
      var sharedTo = _.chain(self.recipients).filter(function (i) {
        return i.pubKey;
      }).map(function (i) {
        return i.pubKey;
      }).value().join(', ');

      spaEngine.initAction("app", "enter", {
        body: body,
        transaction: "documentsSharing",
        sm: "documentsSharing",
        sharedTo: sharedTo
      }, {
        creatTxCallback: self.givePermissions
      });
      project.toast.show(translate("Uploading..."));
      return Promise.resolve();
    }).catch(function (err) {
      self.stopCopyAnim();
      project.toast.show(err, 'alert');
    });
  },

  // encryptFile: encryptFile,
  encryptAndUploadFile: encryptAndUploadFile,
  generateKey: generateKey,
  startCopyAnim: function startCopyAnim() {
    document.getElementById("copywindow").classList.remove("finished");
    document.getElementById("copywindow").classList.add("started");
  },
  stopCopyAnim: function stopCopyAnim() {
    // End animation
    document.getElementById("copywindow").classList.remove("started");
    document.getElementById("copywindow").classList.add("finished");
  },
  givePermissions: async function givePermissions(result, payload) {
    if (!payload.body.contract) return Promise.resolve();
    var contractId = result.tx.asset.data.contractId;
    var recipients = payload.body.keys; // {email, key, pubkey}

    var timeout = payload.body.contract.parameters.timeout;

    var response = await project.ajax.post("/ng-app-documentsSharing-backend/actions/get-federation-nodes", {
      contractId: contractId
    });
    var federationNodes = response.federationNodes;


    await Promise.all(recipients.map(function (user) {
      var key = user.key,
          pubkey = user.pubkey;


      var uint8ToBase64 = function uint8ToBase64(ua) {
        return btoa(Array.prototype.map.call(ua, function (ch) {
          return String.fromCharCode(ch);
        }).join(''));
      };
      var keyB64 = uint8ToBase64(Uint8Array.from(key));
      var length = Math.ceil(keyB64.length / federationNodes.length);
      var secretSecretArray = keyB64.match(new RegExp('.{1,' + length + '}', 'g'));
      var distributedKey = [];

      federationNodes.forEach(function (node, index) {
        distributedKey.push(encodeURIComponent(secretSecretArray[index]));
      });

      return Promise.all(distributedKey.map(function (keyPart, index) {
        return new Promise(function (resolve, reject) {
          project.ajax.post('/ng-app-documentsSharing-backend/actions/save-secret-part', {
            pubKey: pubkey,
            contractId: contractId,
            federationNodeAddress: federationNodes[index],
            keyPart: keyPart,
            timeout: timeout
          }, function () {
            resolve();
          });
        });
      }));
    }));
    return Promise.resolve();
  }
};

/**
 * check if dom module is already registered - if not, then register it
 */

if (!docSharingModule) docSharingModule = Polymer(component);

if (!window.uploadFile) {
  window.uploadFile = new EventEmitter2();
}
}).call(this);