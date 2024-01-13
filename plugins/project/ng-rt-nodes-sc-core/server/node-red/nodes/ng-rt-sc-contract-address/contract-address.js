'use strict';
var logger = require('log4js').getLogger('contract-address');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function ownAddress(config) {
    logger.debug('register contract-address');
    RED.nodes.createNode(this, config);
    var destination = config.destination;

    this.on('input', function(msg) {
      if (!destination) {
        destination = "payload";
      }

      msg[destination] = msg.env.ownContractId;

      this.send(msg);
    });
  }

  RED.nodes.registerType("contract-address", ownAddress);
};
