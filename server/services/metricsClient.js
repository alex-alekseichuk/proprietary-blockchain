'use strict';
const logger = require('log4js').getLogger('metricsClient');
const StatsD = require('hot-shots');
const configService = require('ng-configservice');
const Counter = require('prom-client').Counter;
const register = require('prom-client').register;

configService.read('config/server/config.json');
const metricsPackage = configService.get('metricsPackage');

process.env.ngrtStatsdHost = configService.get('ngrtStatsdHost');
process.env.ngrtStatsdPort = configService.get('ngrtStatsdPort');
const statsdClient = new StatsD({
  host: (process.env.ngrtStatsdHost || '127.0.0.1'),
  port: (process.env.ngrtStatsdPort || '8125'),
  errorHandler: error => logger.error('StatsD exception:', error.message)
});

/**
 * @description Based on config.json, we add stats using statsd or prometheus
 * @param {string} stats the string with names and label
 */
const increment = stats => {
  if (metricsPackage === 'statsD') {
    statsdClient.increment(stats);
  } else {
    stats = stats.replace(/\s/g, '');
    let statsArray = stats.split(',');
    let name = statsArray[0];
    let labelNames = statsArray.slice(1);
    let res = {};

    // convert the array with string x=y into object of x:y
    labelNames.reduce((res, v) => {
      let splitValue = v.split('=');
      if (splitValue.length > 1)
        res[splitValue[0]] = splitValue[1];
      return res;
    }, res);

    let prometheusClient = register.getSingleMetric(name);
    if (!prometheusClient) {
      try {
        prometheusClient = new Counter({
          name: name,
          help: name,
          labelNames: Object.keys(res)
        });
      } catch (err) {
        if (err.message.indexOf("already been registered")) {
          logger.debug("Using existing metric");
        } else {
          logger.error(err.message);
        }
      }
    }
    prometheusClient.labels(...Object.values(res)).inc();
  }
};

module.exports = {
  increment
};
