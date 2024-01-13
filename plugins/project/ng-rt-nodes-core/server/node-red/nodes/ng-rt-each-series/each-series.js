/**
 * Created by alibe on 18.08.2016.
 */

'use strict';

const async = require('async');
// const logger = require('log4js').getLogger('each-series');

module.exports = function(RED) {
  /**
   * Each series node
   * @param {Object} config - configuration of node
   */
  function eachSeries(config) {
    RED.nodes.createNode(this, config);
    this.on('input', function(msg) {
      let self = this;

      /**
       * Each callback
       * @param {Object} item - item
       * @param {Function} cb - callback
       */
      function eachCB(item, cb) {
        msg.eachItem = item;
        msg.eachCB = cb;
        self.send([msg, null]);
      }

      /**
       * Out callback
       * @param {Object} item - item
       * @param {Function} cb - callback
       */
      function outCB(item, cb) {
        self.send([null, msg]);
      }
      let array = msg.ctx.array;
      async.eachSeries(array, eachCB, outCB);
    });
  }
  RED.nodes.registerType("each-series", eachSeries);
};
