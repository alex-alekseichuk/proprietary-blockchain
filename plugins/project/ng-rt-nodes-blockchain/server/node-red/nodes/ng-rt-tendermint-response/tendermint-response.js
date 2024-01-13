'use strict';

module.exports = function(RED) {
  /**
    *
    * @param {*} n Node
    */
  function tendermintResponseNode(n) {
    RED.nodes.createNode(this, n);
    this.property = n.property;
    this.propertyType = n.propertyType || "msg";
    this.checkall = n.checkall;
    this.previousValue = null;
    var node = this;

    this.on('input', function(msg) {
      try {
        // var prop = RED.util.evaluateNodeProperty(node.property, node.propertyType, node, msg);
        if (node.checkall === 'true') {
          msg.ctx.response = {
            code: 0,
            log: 'OK '
          };
        } else {
          msg.ctx.response = {
            code: -1,
            log: 'not validated '
          };
        }
        this.send(msg);
      } catch (err) {
        node.warn(err);
      }
    });
  }
  RED.nodes.registerType("tendermint-response", tendermintResponseNode);
};
