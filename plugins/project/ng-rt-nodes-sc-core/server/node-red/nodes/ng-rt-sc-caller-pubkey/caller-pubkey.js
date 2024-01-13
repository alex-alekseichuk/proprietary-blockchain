'use strict';
var logger = require('log4js').getLogger('caller-pubkey');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function callerPubkey(config) {
    logger.debug('register caller-pubkey');
    RED.nodes.createNode(this, config);
    var destination = config.destination;

    this.on('input', function(msg) {
      if (!destination) {
        destination = "payload";
      }

      msg[destination] = msg.env.caller;

      this.send(msg);
    });
  }

  RED.nodes.registerType("caller-pubkey", callerPubkey);
};
