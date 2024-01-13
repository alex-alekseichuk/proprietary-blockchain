'use strict';
const logger = require("log4js").getLogger("route_statsd");
const StatsD = require('hot-shots');
const statsd = new StatsD({
  host: (process.env.ngrtStatsdHost || '127.0.0.1'),
  port: (process.env.ngrtStatsdPort || '8125'),
  errorHandler: error => logger.error('StatsD exception:', error.message)
});
const configService = require('ng-configservice');

configService.read('config/server/config.json');

module.exports = function() {
  return function routeStatsd(req, res, next) {
    if (configService.get('statsd:route:enabled')) {
      statsd.increment(`routes, route=${req.url}, type=${req.method}`);
    }
    next();
  };
};
