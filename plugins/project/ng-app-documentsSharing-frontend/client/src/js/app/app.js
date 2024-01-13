'use strict';

/* global window, pajax, moment, atob, document, _, ajax, localStorage, setFile, setStorage, translate, I18nMsg, opr */
/* global navigator, InstallTrigger, encryptAndUploadFile, Polymer, generateKey, EventEmitter2 */
/* eslint-disable no-nested-ternary, new-cap, no-undef */
/* eslint-disable complexity */
/* eslint-disable */

let component = {
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
  ready: function() {
    // Logger
    this.logger = window.log4js.getLogger('ng-app-documentsSharing-frontend/app/app');
    this.logger.debug('DocumentsSharing ready!');
    return this.getEmailSend()
      .then(res => {
        return pajax.get('/ng-app-documentsSharing-backend/settings');
      })
      .then(res => {
        if (!res.success) throw new Error('get settings without success');
        this.logger.trace('get settings = ' + JSON.stringify(res));
        this.hideinbox = (res.settings || {}).hideinbox;
        return this.hideinbox;
      })
      .catch(err => {
        this.logger.error('get settings error = ' + JSON.stringify(err));
      });
  },

  hideToStyle: function(hide) {
    if (hide) return 'medium;';
    else if (!hide) return 'medium-tall';
  },
  ActiveTabCheck: function(index, selected) {
    return index == selected;
  },
  getEmailSend: function() {
    return pajax.get('/ng-app-documentsSharing-backend/emailSend')
      .then(ret => {
        if (!ret.success) {
          this.inboxDB = [];
          return this.inboxDB;
        }
        if (!Array.isArray(ret.emails)) throw new Error('emails not array');
        ret.emails.forEach(email => {
          // if (!email.date) email.date = new Date();
          if (!email.date) email.date = '';
          if (email.date) email.date = moment(email.date).format('DD.MM.YY HH:mm');
          // email.seen = Math.random() > 0.5 ? 'Not seen' : 'Seen';
          let userEmail = JSON.parse(atob(localStorage.session_token.split('.')[1])).email;
          email.seen = email.payload.expiration !== 'never' && Date.parse(email.payload.expiration) < Date.parse(new Date()) ?
            'Expired' :
            (email.payload.seen || []).indexOf(userEmail) === -1 ? 'Not seen' : 'Seen';
        });
        this.inboxDB = ret.emails;
      })
      .catch(err => {
        this.logger.error('get emailSend error = ' + JSON.stringify(err));
        this.inboxDB = [];
      });
  },

  emailClick: function(ev) {
    this.logger.trace('emailClick = ' + ev);

    const item = (ev.model || {}).item || {};
    const id = item.id;
    const href = (item.payload || {}).href;

    this.logger.debug('email id = ' + id);
    this.logger.debug('email href = ' + href);

    if (item.payload.expiration === 'never' || Date.parse(item.payload.expiration) >= Date.parse(new Date())) {
      var a = document.createElement('a');

      a.href = href;

      if (!href) {
        return this.logger.debug('cant download, no href');
      }

      window.location.href = a.pathname + a.search;

      return pajax.post('/ng-app-documentsSharing-backend/emailSeen', { id })
        .catch(err => this.logger.error('post emailSeen error = ' + JSON.stringify(err)))
        .then(ret => {
          this.logger.trace('post emailSeen ret = ' + JSON.stringify(ret));
          return this.getEmailSend();
        });
    }
  },

  toggleEncrypt: function() {
    this.enableEncrypt = !this.enableEncrypt;
  },

  contactBookListener: function() {
    let self = this;
    self.$.components_contact_book
      .addEventListener('acceptSelected', ev => {
        self.set('recipients', []);
        self.$.components_contact_book.ready();
        _.chain(ev.detail.selectedEmails)
          .forEach(email => {
            if (!_.find(self.recipients, { pubKey: email })) {
              self.push('recipients', {
                pubKey: email
              });
            }
          })
          .value();
      });
  },
  addRecipient: function() {
    let self = this;
    self.push('recipients', {
      pubKey: ""
    });
  },
  displayIndex: index => index + 1,
  removeRecepient: function(event) {
    let self = this;
    self.splice("recipients", event.model.index, 1);
  },
  attached: function() {
    let self = this;
    I18nMsg.url = '/ng-app-documentsSharing-frontend/locales'; // optionally use custom folder for locales.
    // Platform.performMicrotaskCheckpoint();
    self.contactBookListener();

    self.enableEncrypt = true;

    Promise.all([
        new Promise(res =>
          ajax.get('/ng-app-documentsSharing-backend/nsi/providers', res)
        ),
        new Promise(res =>
          ajax.get('/user-profile', 'ng-rt-jwt-auth', res)
        ),
        new Promise(res =>
          ajax.get('/ng-rt-components-backend/contacts', {}, res)
        ),
        new Promise(res =>
          ajax.get('/ng-app-documentsSharing-backend/projects', {}, res)
        )
      ])
      .then(data => {
        self.providers = data[0];
        self.setStorage('rethinkdb');
        self.$.storageType.disabled = !data[1].advanced;
        self.$.storageSection.hidden = !data[1].advanced;
        self.$.enableEncrypt.hidden = !data[1].advanced;
        self.contacts = _.chain(data[2].contacts)
          .map(c => c.email)
          .value();
        self.projects = data[3] || [];
        if (self.recipients.length == 0) self.addRecipient();
      });
  },
  isChrome: function() {
    var browser = function() {
      // Return cached result if avalible, else get result then cache it.
      if (browser.prototype._cachedResult)
        return browser.prototype._cachedResult;

      // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
      var isOpera = (Boolean(window.opr) && Boolean(opr.addons)) ||
        Boolean(window.opera) ||
        navigator.userAgent.indexOf(' OPR/') >= 0;

      // Firefox 1.0+
      var isFirefox = typeof InstallTrigger !== 'undefined';

      // At least Safari 3+: "[object HTMLElementConstructor]"
      var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;

      // Chrome 1+
      var isChrome = Boolean(window.chrome) && !isOpera;

      // At least IE6
      var isIE = /* @cc_on!@*/ false || Boolean(document.documentMode);

      // Edge 20+
      var isEdge = !isIE && Boolean(window.StyleMedia);

      browser.prototype._cachedResult =
        isOpera ? 'Opera1' :
        isFirefox ? 'Firefox' :
        isSafari ? 'Safari' :
        isChrome ? 'Chrome' :
        isIE ? 'IE' :
        isEdge ? 'Edge' :
        "Don't know";
      return browser.prototype._cachedResult;
    };

    if (browser() != "Chrome") return true;
    return false;
  },
  // get content of selected file
  setFile: setFile,
  setStorage: setStorage,
  onSubmit: async function() {
    let self = this;
    new Promise((resolve, reject) => {
        if (!self.recipients || self.recipients.length == 0) return reject(translate('Select recipients!'));
        if (!document.getElementById('fileToShare').value) return reject(translate('Select file!'));
        resolve();
      })
      .then(() =>
        _.chain(self.recipients)
        .filter(r => _.isEmpty(r.pubKey)) // check all recipients have pubKey
        .isEmpty()
        .value() ? Promise.resolve() : Promise.reject(translate("Error in recipients"))
      )
      .then(() => {
        this.startCopyAnim();
        return new Promise(res => {
          ajax.post('/ng-app-documentsSharing-backend/nsi/emailsAndPubkeys', {
            recipients: self.$.recipients.items
          }, res);
        });
      })
      .then(result => {
        if ((result.unknown_emails || []).length) {
          return Promise.reject(translate('Unknown emails: ') + result.unknown_emails.join(', '));
        } else if (result.variant == "OK") {
          return self.generateKey(result.result);
        }
        return Promise.reject(translate("User with such public key not found!"));
      })
      .then(result => self.encryptAndUploadFile(result))
      .then(body => {
        let spaEngine = document.querySelector('#documentsSharing');

        body.additionalMsg = self.additionalMsg;
        let sharedTo = _.chain(self.recipients)
          .filter(i => i.pubKey)
          .map(i => i.pubKey)
          .value().join(', ');

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
      })
      .catch(err => {
        self.stopCopyAnim();
        project.toast.show(err, 'alert');
      });
  },

  // encryptFile: encryptFile,
  encryptAndUploadFile: encryptAndUploadFile,
  generateKey: generateKey,
  startCopyAnim: function() {
    document.getElementById("copywindow").classList.remove("finished");
    document.getElementById("copywindow").classList.add("started");
  },
  stopCopyAnim: function() {
    // End animation
    document.getElementById("copywindow").classList.remove("started");
    document.getElementById("copywindow").classList.add("finished");
  },
  givePermissions: async function(result, payload) {
    if (!payload.body.contract)
      return Promise.resolve();
    const contractId = result.tx.asset.data.contractId;
    const recipients = payload.body.keys; // {email, key, pubkey}

    var timeout = payload.body.contract.parameters.timeout;

    let response = await project.ajax.post(`/ng-app-documentsSharing-backend/actions/get-federation-nodes`, {
      contractId
    });
    const {
      federationNodes
    } = response;

    await Promise.all(recipients.map(user => {
      const {
        key,
        pubkey
      } = user;

      const uint8ToBase64 = ua => btoa(Array.prototype.map.call(ua, ch =>
        String.fromCharCode(ch)
      ).join(''));
      const keyB64 = uint8ToBase64(Uint8Array.from(key));
      const length = Math.ceil(keyB64.length / federationNodes.length);
      const secretSecretArray = keyB64.match(new RegExp('.{1,' + length + '}', 'g'));
      const distributedKey = [];

      federationNodes.forEach((node, index) => {
        distributedKey.push(encodeURIComponent(secretSecretArray[index]));
      });

      return Promise.all(distributedKey.map((keyPart, index) => {
        return new Promise((resolve, reject) => {
          project.ajax.post('/ng-app-documentsSharing-backend/actions/save-secret-part', {
            pubKey: pubkey,
            contractId,
            federationNodeAddress: federationNodes[index],
            keyPart,
            timeout
          }, () => {
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

if (!docSharingModule)
  docSharingModule = Polymer(component);

if (!window.uploadFile) {
  window.uploadFile = new EventEmitter2();
}