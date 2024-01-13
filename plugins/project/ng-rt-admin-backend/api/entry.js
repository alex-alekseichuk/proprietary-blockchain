'use strict';

const logger = require('log4js').getLogger('ng-rt-admin.template');
const fs = require("fs");
const path = require("path");
const { promisify } = require('util');

let plgn;

module.exports = {
  activate: (server, plugin, pluginInstance) => {
    let services = server.plugin_manager.services;
    let i18n = services.get("i18n");
    plgn = pluginInstance.name;

    delete require.cache[require.resolve('./routes')];
    require('./routes').activate(server, plugin, pluginInstance);
    const EmailTemplate = server.models.emailTemplate;

    server.models.emailTemplate.find({where: {name: 'schedule'}})
      .then(found => {
        logger.debug('schedule template found.length =', found.length);
        if (found.length) return logger.debug('schedule template already exists');
        return promisify(fs.readFile)(path.resolve(pluginInstance.path.absolute,
          "api/config/mailtemplate/mail.html"))
          .then(data => new Promise((resolve, reject) =>
              EmailTemplate.create({
                subject: "schedule",
                body: data,
                name: "schedule",
                attachments: [
                  {
                    filename: 'logo.jpg',
                    path: path.resolve(pluginInstance.path.absolute, 'api/config/mailtemplate/logo.jpg'),
                    cid: 'logo.jpg' // same cid value as in the html img src
                  }
                ]
              }, (err, obj) => {
                if (err) return reject(err);
                return resolve(obj);
              })
            )
          )
          .then(() => {
            logger.debug('Created new email template for schedule');
          });
      })
      .catch(err => {
        logger.error("Mail template write error", err);
      });

    server.models.emailTemplate.find({where: {name: 'sendEmail'}})
      .then(result => {
        logger.debug(i18n.__(`sendEmail template found = ${result.length}`));
        if (result.length) return logger.debug(i18n.__('sendEmail template already exists'));
        return promisify(fs.readFile)(
          path.resolve(pluginInstance.path.absolute, "api/config/mailtemplate/sendEmail.html")
        )
          .then(data =>
            new Promise((res, rej) =>
              server.models.emailTemplate.create({
                subject: "Please activate your license in ",
                body: data,
                name: "sendEmail",
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
            logger.debug(i18n.__('Created new email template sending Email'));
          });
      })
      .catch(err => {
        logger.error(i18n.__(`Mail template write error, ${err}`));
      });

    let storekeyData;
    promisify(fs.readFile)(path.resolve(pluginInstance.path.absolute, "api/config/mailtemplate/storekey.html"))
      .then(data => {
        storekeyData = data;
        return EmailTemplate.findOne({where: {name: "storekey"}});
      })
      .then(template => new Promise((resolve, reject) => {
        if (template)
          return resolve();
        return server.models.emailTemplate.create({
          subject: "storekey",
          body: storekeyData,
          name: "storekey",
          attachments: [
            {
              filename: 'logo.jpg',
              path: path.resolve(pluginInstance.path.absolute, 'api/config/mailtemplate/logo.jpg'),
              cid: 'logo.jpg' // same cid value as in the html img src
            }
          ]
        }, (err, obj) => {
          if (err) return reject(err);
          return resolve(obj);
        });
      })
      );
  },
  deactivate: {
    static: '/admin',
    locales: '/admin/' + plgn + '/locales',
    config: '/config'
  }
};
