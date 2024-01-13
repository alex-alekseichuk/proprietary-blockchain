/* eslint-disable */
var loopback = require('loopback');
var logger = require('log4js').getLogger('get-memory-field');

module.exports = function (RED) {
  /**
   * 
   * @param {*} config Config
   */
  function getMemory(config) {

    RED.nodes.createNode(this,config);
    var field = config.field;
    var destination = config.destination;

    this.on('input', function(msg) {

      if (!destination)
      {
        destination = "payload";
      }

      logger.debug(field, ">>", destination);
      logger.debug("value:", msg.memory[field]);

      msg[destination] = msg.memory[field];

      this.send(msg);

    });
  }

  RED.nodes.registerType("get-memory-field", getMemory);
}
