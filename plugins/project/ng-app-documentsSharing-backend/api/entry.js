"use strict";

const loopback = require('loopback');
const logger = require('log4js').getLogger('ng-app-documentSharing.registerProviders');
const i18n = require('i18n');
const fs = require("fs");
const path = require("path");
const Promise = require('bluebird');
const routes = require('./routes');

module.exports = {
  activate: (server, plugin, pluginInstance) => {
    routes.activate(server, plugin, pluginInstance);

    // Go though list of off_chain records
    // And find out secretsecret keys should be expired
    logger.debug(i18n.__('Check list of secretSecret keys for expiration'));
    let now = Date.now();
    let OffChainModel = loopback.findModel('localIsolatedMemory');
    OffChainModel
      .find({where: {'value.expires': true, 'value.secretsecret': {neq: 'expired'}}})
      .then(pairs => {
        if (pairs.length > 0) {
          logger.debug(i18n.__('Found secretSecret keys to be expired now or in the future'));
        }
        pairs.forEach(pair => {
          let tte = pair.value.expiresAt - now; // Time To Expire (milliseconds)
          if (tte <= 0) {
            logger.debug(i18n.__('Secret key expired'));
            pair.updateAttribute('value.secretsecret', 'expired');
          } else {
            setTimeout(() => {
              logger.debug(i18n.__('Secret key expired'));
              pair.updateAttribute('value.secretsecret', 'expired');
            }, tte);
          }
        });
      })
      .catch(err => logger.error(err));

    server.models.emailTemplate.find({where: {name: 'documentSharing'}})
      .then(found => {
        logger.debug('documentSharing template found.length =', found.length);
        if (found.length) return logger.debug('documentSharing template already exists');
        return Promise.promisify(fs.readFile)(
          path.resolve(pluginInstance.path.absolute, "api/config/mailtemplate/mail.html")
        )
          .then(data =>
            new Promise((res, rej) =>
              server.models.emailTemplate.create({
                subject: "Download shared file",
                body: data,
                name: "documentSharing",
                attachments: [
                  {
                    filename: 'logo.jpg',
                    path: path.resolve(pluginInstance.path.absolute, 'api/config/mailtemplate/logo.jpg'),
                    cid: 'logo.jpg' // same cid value as in the html img src
                  }
                ]
              }, (err, obj) => err ? rej(err) : res(obj)
              )
            )
          )
          .then(() => {
            logger.debug('Created new email template "mail" for documentsSharing');
          });
      })
      .catch(err => {
        logger.error("Mail template write error", err);
      });

    server.models.emailTemplate.find({where: {name: 'mailVendor'}})
      .then(found => {
        logger.debug('mailVendor template found.length =', found.length);
        if (found.length) return logger.debug('mailVendor template already exists');
        return Promise.promisify(fs.readFile)(
          path.resolve(pluginInstance.path.absolute, "api/config/mailtemplate/mailVendor.html")
        )
          .then(data =>
            new Promise((res, rej) =>
              server.models.emailTemplate.create({
                subject: "Download shared file",
                body: data,
                name: "mailVendor",
                attachments: [
                  {
                    filename: 'logoVendor.png',
                    path: path.resolve(pluginInstance.path.absolute, 'api/config/mailtemplate/logoVendor.png'),
                    cid: 'logoVendor.png' // same cid value as in the html img src
                  }
                ]
              }, (err, obj) => err ? rej(err) : res(obj)
              )
            )
          )
          .then(() => {
            logger.debug('Created new email template "mail" for documentsSharing');
          });
      })
      .catch(err => {
        logger.error("Mail template write error", err);
      });

    server.models.emailTemplate.find({where: {name: 'DS_feedback'}})
      .then(found => {
        logger.debug('DS_feedback template found.length =', found.length);
        if (found.length) return logger.debug('DS_feedback template already exists');
        return Promise.promisify(fs.readFile)(
          path.resolve(pluginInstance.path.absolute, "api/config/mailtemplate/DS_feedback.html")
        )
          .then(data =>
            new Promise((res, rej) =>
              server.models.emailTemplate.create({
                subject: "Shared file downloaded",
                body: data,
                name: "DS_feedback",
                attachments: [
                  {
                    filename: 'logo.jpg',
                    path: path.resolve(pluginInstance.path.absolute, 'api/config/mailtemplate/logo.jpg'),
                    cid: 'logo.jpg' // same cid value as in the html img src
                  }
                ]
              }, (err, obj) => err ? rej(err) : res(obj)
              )
            )
          )
          .then(() => {
            logger.debug('Created new email template "Vendor" for documentsSharing');
          });
      })
      .catch(err => {
        logger.error("Mail template write error", err);
      });

    server.models.emailTemplate.find({where: {name: 'DS_feedbackVendor'}})
      .then(found => {
        logger.debug('DS_feedbackVendor template found.length =', found.length);
        if (found.length) return logger.debug('DS_feedbackVendor template already exists');
        return Promise.promisify(fs.readFile)(
          path.resolve(pluginInstance.path.absolute, "api/config/mailtemplate/DS_feedbackVendor.html")
        )
          .then(data =>
            new Promise((res, rej) =>
              server.models.emailTemplate.create({
                subject: "Shared file downloaded",
                body: data,
                name: "DS_feedbackVendor",
                attachments: [
                  {
                    filename: 'logoVendor.png',
                    path: path.resolve(pluginInstance.path.absolute, 'api/config/mailtemplate/logoVendor.png'),
                    cid: 'logoVendor.png' // same cid value as in the html img src
                  }
                ]
              }, (err, obj) => err ? rej(err) : res(obj)
              )
            )
          )
          .then(() => {
            logger.debug('Created new email template "DS_feedbackVendor" for documentsSharing');
          });
      })
      .catch(err => {
        logger.error("Mail template write error", err);
      });
  },
  deactivate: {
    "documents-sharing": {path: "/documents-sharing"},
    "share-document": {path: "/share-document"},
    "create-digital-asset": {path: "/create-digital-asset"},
    "download-shared-document": {path: "/download-shared-document"},
    "get-shared-document-phase1": {path: "/get-shared-document-phase1"},
    "get-storage-by-filesize": {path: "/get-storage-by-filesize"},
    "locales": 'admin/ng-app-documentsSharing-backend/locales'
  }
};
