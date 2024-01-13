'use strict';
var logger = require('log4js').getLogger('get-transfer-info');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function getTransferInfo(config) {
    RED.nodes.createNode(this, config);
    var destination = config.destination;

    this.on('input', function(msg) {
      logger.debug("transfer data");
      logger.debug(msg.transferData);

      if (!destination) {
        destination = "payload";
      }

      msg[destination] = msg.transferData;

      this.send(msg);
    });
  }

  RED.nodes.registerType("get-transfer-info", getTransferInfo);
};
