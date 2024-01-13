/**
 * Loopback model mixin to log stats and modified, updated info.
 */
/* eslint no-unused-vars: ["error", { "vars": "local" }] */
"use strict";

// recordType Handling
// Internal record 1 - 4 Customer records 6 - 9
//
// 1 : delete = false , modifed =false
// 2 : delete = false , modifed =true
// 3 : delete = true , modifed =false
// 4 : delete = true , modifed =true
// 5 : reserved

// 6 : delete = false , modifed =false
// 7 : delete = false , modifed =true
// 8 : delete = true , modifed =false
// 9 : delete = true , modifed =true

// recordStatus
// A: Active
// D: Deleted

const loopback = require('loopback');
const uuid = require('uuid');
const logger = require('log4js').getLogger('recordObserver.js');

const metricsClient = require("./../services/metricsClient");
const contextService = require("../backend/context");

module.exports = function(Model) {
  logger.trace('executing recordObserver.js');

  Model.observe('before delete', function(ctx, next) {
    logger.trace('event before delete ');
    metricsClient.increment(`model, modelName=${ctx.Model.modelName}, source=recordObserver, method=before_delete`);
    next();
  });

  Model.observe('after delete', function(ctx, next) {
    logger.trace('after before delete ');
    metricsClient.increment(`model, modelName=${ctx.Model.modelName}, source=recordObserver, method=after_delete`);
    next();
  });

  Model.observe('before save', function(ctx, next) {
    logger.trace('event before save ');
    metricsClient.increment(`model, modelName=${ctx.Model.modelName}, source=recordObserver, method=before_save`);

    if (!contextService) {
      logger.trace('No context for Model %s found ', ctx.Model.modelName);
      return next();
    }

    const user = contextService.get('user');
    if (!user) {
      logger.trace('No user info in context for Model %s found ', ctx.Model.modelName);
      return next();
    }

    // new record - set by loopback automatically PUT call
    if (ctx.isNewInstance) {
      logger.trace('New instance / record');

      ctx.instance.createdBy = user.id;
      ctx.instance.modifiedBy = user.id;
      ctx.instance.uuid = uuid.v4(); // v4 random for the lifetime of the JS runtime , v4 time based
      ctx.instance.recordStatus = 'A';
    } else {
      // toDo we need to figure out the existence of a new record versus update record for POST calls.
      // a new record via POST looks like an exiting one
      logger.trace(' Existing instance / record');
      // update record
      ctx.data.modifiedBy = user.id;
      ctx.data.recordStatus = 'A';
    }

    next();
  });

  Model.observe('after save', function(ctx, next) {
    logger.trace('event after save');
    metricsClient.increment(`model, modelName=${ctx.Model.modelName}, source=recordObserver, method=after_save`);
    next();
  });

  Model.observe('access', function(ctx, next) {
    logger.trace('event access');
    metricsClient.increment(`model, modelName=${ctx.Model.modelName}, source=recordObserver, method=access`);
    next();
  });

  Model.notifySyncObservers = function(method, ctx, next) {
    // Running sync node-red operation test on commonDataModel
    metricsClient.increment(`notifySyncObserver, modelName=${ctx.Model.modelName}`);

    var model = loopback.findModel(ctx.Model.modelName);
    model.notifyObserversOf(method, ctx, function() {
      logger.trace('call of syncobserver ended');
      next();
    });
  };
};
