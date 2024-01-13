/**
 * Created by alibe on 18.08.2016.
 */

'use strict';

const logger = require('log4js').getLogger('each-item-end');

module.exports = function(RED) {
  /**
   * Each item end node
   * @param {Object} config - configuration of node
   */
  function eachSeries(config) {
    logger.debug('register each item end module');
    RED.nodes.createNode(this, config);
    this.on('input', function(msg) {
      if (msg.eachCB)
        msg.eachCB();
    });
  }
  RED.nodes.registerType("each-item-end", eachSeries);
};
