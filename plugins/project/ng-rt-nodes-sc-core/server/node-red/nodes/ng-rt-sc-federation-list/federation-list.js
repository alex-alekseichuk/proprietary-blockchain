'use strict';
// var logger = require('log4js').getLogger('federation-list');

module.exports = function(RED) {
    /**
   *
   * @param {*} config Config
   */
  function federationList(config) {
    RED.nodes.createNode(this, config);
    var destination = config.destination;

    this.on('input', function(msg) {
      if (!destination) {
        destination = "payload";
      }

      msg[destination] = msg.env.federationNodes;

      this.send(msg);
    });
  }

  RED.nodes.registerType("federation-list", federationList);
};
