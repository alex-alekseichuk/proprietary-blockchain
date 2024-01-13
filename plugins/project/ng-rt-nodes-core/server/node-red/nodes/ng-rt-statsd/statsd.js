/**
 * Created by michael reh on 18.08.2016.
 */

'use strict';

/* global ngrtStatsdHost, ngrtStatsdPort */

const logger = require('log4js').getLogger('statsD');
const StatsD = require('hot-shots');
const statsd = new StatsD({
  host: (process.env.ngrtStatsdHost || '127.0.0.1'),
  port: (process.env.ngrtStatsdPort || '8125'),
  errorHandler: error => logger.error('StatsD exception:', error.message)
});

module.exports = function(RED) {
  /**
   * Create stats D node
   * @param {Object} config - configuration of node
   */
  function createStatsD(config) {
    logger.trace('ngrtStatsdHost :', ngrtStatsdHost);
    logger.trace('ngrtStatsdPort :', ngrtStatsdPort);
    logger.debug('statsD');

    RED.nodes.createNode(this, config);

    this.on('input', function(msg) {
      logger.debug('input statsD', msg);
      logger.debug('config.datatype : ', config.datatype);

      if (config.datatype == "increment") {

      } else if (config.datatype == "gauge") {

      }

      let statisticalEvent = msg.ctx.statisticalEvent || config.statisticalEvent;
      logger.debug('statisticalEvent ', statisticalEvent);
      statsd.increment(statisticalEvent);

      this.log('statsD: ', statisticalEvent);
      this.send(msg);
    });
  }

  RED.nodes.registerType('statsD', createStatsD);
};
