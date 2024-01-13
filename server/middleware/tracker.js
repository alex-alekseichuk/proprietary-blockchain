'use strict';
const logger = require("log4js").getLogger("route_statsd");
const metricsClient = require("./../services/metricsClient");

const configService = require('ng-configservice');
configService.read('config/server/config.json');

module.exports = function() {
  return function tracker(req, res, next) {
    if (configService.get('statsd:tracking:enabled')) {
      logger.trace('Request tracking middleware triggered on %s', req.url);
      var start = process.hrtime();
      res.once('finish', function() {
        var diff = process.hrtime(start);
        var ms = diff[0] * 1e3 + diff[1] * 1e-6;
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        metricsClient.increment(`tracking, route=${req.url}, time=${ms}, remoteIp=${ip}`);
      });
    }

    next();
  };
};
