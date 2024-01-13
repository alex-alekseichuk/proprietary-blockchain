/**
 * Loopback model mixin to add and check domainId provided in the loopback context.
 */
"use strict";

const logger = require('log4js').getLogger('mixins.domain');
const metricsClient = require("./../services/metricsClient");

module.exports = function(Model, options) {
  logger.trace('executing domain.js');

  Model.observe('before delete', function(ctx, next) {
    logger.trace('event before delete ');

    metricsClient.increment(`model, modelName=${ctx.Model.modelName}, source=domainObserver, method=before_delete`);

    next();
  });

  Model.observe('before save', function(ctx, next) {
    logger.trace('event before save ');
    metricsClient.increment(`model, modelName=${ctx.Model.modelName}, source=domainObserver, method=before_save`);

    next();
  });

  Model.observe('access', function(ctx, next, cb) {
    logger.trace('event access');
    logger.trace('Accessing %s matching %s', ctx.Model.modelName, ctx.query.where);
    metricsClient.increment(`model, modelName=${ctx.Model.modelName}, source=domainObserver, method=before_save`);

    next();
  });
};
