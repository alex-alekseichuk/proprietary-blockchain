'use strict';
const logger = require('log4js').getLogger('routes/metrics');
const serviceManager = require('../services');
const Prometheus = require('prom-client');

/**
 * API/Route/metrics
 *
 * @module API/Route/metrics
 * @type {Object}
 */

module.exports = server => {
  const i18n = serviceManager.get('i18n');
  const getMetrics = (req, res) => {
    logger.trace(i18n.__('getMetrics'));
    Prometheus.collectDefaultMetrics();
    res.end(Prometheus.register.metrics());
  };

  /**
   * Get the prometheus metrics
   *
   * @name Get metrics for prometheus that supports histogram, summaries, gauges and counters of assigned public Keys for a user
   * @route {GET} /${namespace}/metrics
   * @authentication None
   */
  server.get(`/metrics`, getMetrics);
};
