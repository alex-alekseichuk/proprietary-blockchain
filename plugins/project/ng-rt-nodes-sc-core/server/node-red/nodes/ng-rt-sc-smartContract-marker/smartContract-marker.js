'use strict';

module.exports = function(RED) {
/**
 *
 * @param {*} config Config
 */
  function fscmarker(config) {
    RED.nodes.createNode(this, config);

    this.on('input', function(msg) {
      this.send(msg);
    });
  }

  RED.nodes.registerType("project-sc-1.0", fscmarker);
};
