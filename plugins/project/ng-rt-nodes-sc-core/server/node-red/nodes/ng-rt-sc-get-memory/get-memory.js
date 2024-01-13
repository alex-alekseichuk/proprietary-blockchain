/* eslint-disable */

var logger = require('log4js').getLogger('get-memory');

module.exports = function (RED) {
  /**
   * 
   * @param {*} config Config
   */
  function getMemory(config) {

    RED.nodes.createNode(this,config);
    var destination = config.destination;

    this.on('input', function(msg) {

      if (!destination)
      {
        destination = "payload";
      }

      logger.debug( ">>", destination, " >> ", msg.memory);

      msg[destination] = msg.memory;
      this.send(msg);

    });
  }

  RED.nodes.registerType("get-memory", getMemory);
}
