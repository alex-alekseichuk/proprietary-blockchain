/* eslint-disable */
var loopback = require('loopback');
var logger = require('log4js').getLogger('transfer-history');

module.exports = function (RED) {
  /**
   * 
   * @param {*} config Config
   */
  function transferHistory(config) {

    logger.debug('register transfer-history');
    RED.nodes.createNode(this,config);
    var destination = config.destination;

    this.on('input', function(msg) {

      logger.debug("--- msg.transferData ---", destination);
      logger.debug(msg.transferData);

      if (!destination)
      {
        destination = "payload";
      }

      msg[destination] = msg.transferData.history;

      this.send(msg);

    });
  }

  RED.nodes.registerType("transfer-history", transferHistory);
}
