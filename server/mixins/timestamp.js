/**
 * Loopback model mixin to log created and modified datetimes
 */
"use strict";

const logger = require('log4js').getLogger('recordObserver.js');

module.exports = function(Model, options) {
  logger.trace('executing timestamp.js');

  Model.observe('before save', function(ctx, next) {
    logger.trace('event before save ');

    const currentDateTime = new Date();

    if (ctx.isNewInstance) {
      ctx.instance.createdOn = currentDateTime;
      ctx.instance.modifiedOn = currentDateTime;
    } else {
      ctx.data.modifiedOn = currentDateTime;
    }
    next();
  });
};
