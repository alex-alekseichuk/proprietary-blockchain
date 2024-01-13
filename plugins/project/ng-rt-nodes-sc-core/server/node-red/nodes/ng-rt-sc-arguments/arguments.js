/* eslint-disable */
'use strict';

var logger = require('log4js').getLogger('arguments');

module.exports = function (RED) {
/**
 * 
 * @param {*} config Config
 */
  function farguments(config) {

    RED.nodes.createNode(this,config);
    var position = config.position;
    var destination = config.destination;

    this.on('input', function(msg) {
      
      if (!destination)
      {
        destination = "payload";
      }

      msg[destination] = msg.args[position];

      this.send(msg);

    });
  }

  RED.nodes.registerType("arguments", farguments);
}
