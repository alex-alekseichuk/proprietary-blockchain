'use strict';
// const logger = require("log4js").getLogger("route_prometheus");
const metrics = require('../services/metrics');
const configService = require('ng-configservice');

configService.read('config/server/config.json');

module.exports = function() {
  return function routePrometheus(req, res, next) {
    metrics.requestCounters(req, res, next);
  };
};
