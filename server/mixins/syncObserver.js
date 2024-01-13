'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('syncObserver.js');

module.exports = function(Model, options) {
  Model.notifySyncObservers = function(method, ctx, next) {
    // Running sync node-red operation test on commonDataModel
    Model.notifyObserversOf(method, ctx, function(err, ctx) {
      if (err) return next(err);
      logger.debug('call of syncobserver ended');
      next();
    });
  };
};
