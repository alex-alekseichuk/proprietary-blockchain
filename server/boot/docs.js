'use strict';

const logger = require('log4js').getLogger('boot.docs');
const fs = require('fs-extra');
const i18n = require('i18n');

let source = `dist/docs/api`;
let target = `config/docs/api/ng-rt-core`;

module.exports = function(app, cb) {
  if (app.serviceMode)
    return cb();
  if (!fs.existsSync(source))
    return cb(null);
  fs.remove(target, err => {
    if (err) {
      logger.error(err);
      return cb(err);
    }
    fs.copy(source, target, err => {
      if (err) {
        logger.error(err);
        return cb(err);
      }
      logger.debug(i18n.__('Docs copied successfully'));
      cb(null);
    });
  });
};

