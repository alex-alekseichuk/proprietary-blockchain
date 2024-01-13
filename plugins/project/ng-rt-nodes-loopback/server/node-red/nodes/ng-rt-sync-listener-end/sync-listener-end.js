'use strict';

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function SynclistenerEndNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.on('input', function(msg) {
      msg.next(msg);
    });

    node.on('close', function() {

    });
  }

  RED.nodes.registerType("sync-listener-end", SynclistenerEndNode);
};
