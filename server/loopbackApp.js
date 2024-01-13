"use strict";
const loopback = require('loopback');
const boot = require('loopback-boot');
const logger = require('log4js').getLogger('loopbackApp');

module.exports = async (serviceMode, skipBoot) => {
  return new Promise((resolve, reject) => {
    let app = loopback();
    app.serviceMode = serviceMode;
    if (skipBoot)
      return resolve(app);
    boot(app, __dirname, err => {
      if (err)
        return reject(err);
      logger.debug('boot completed');
      return resolve(app);
    });
  });
};
