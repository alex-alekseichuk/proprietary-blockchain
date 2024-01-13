'use strict';
const logger = require('log4js').getLogger('callContext-settings.js');

module.exports = options => {
  logger.debug('Executing callContext-setting.js');

  return function populateContext(req, res, next) {
    next();
  };
};
