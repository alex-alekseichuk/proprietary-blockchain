/**
 * Created by alibe on 18.08.2016.
 */

'use strict';

const request = require('request');
// const logger = require('log4js').getLogger('http-request');

/* eslint-disable handle-callback-err */

module.exports = function(RED) {
  /**
   * Http request node
   * @param {Object} config - configuration of node
   */
  function httpRequest(config) {
    RED.nodes.createNode(this, config);
    this.on('input', function(msg) {
      let self = this;
      request(msg.http, function(err, response, body) {
        msg.httpResponse = response;
        msg.httpResponseBody = body;
        self.send(msg);
      });
    });
  }

  RED.nodes.registerType("http-request", httpRequest);
};
