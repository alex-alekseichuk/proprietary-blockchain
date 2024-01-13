'use strict';
const loopback = require('loopback');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function FindNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let modelName = config.modelname;
    var Model = loopback.findModel(modelName);

    node.on('input', function(msg) {
      if (typeof msg.payload !== 'object')
        msg.payload = {};
      let filter = msg.payload.filter || config.filter || {};
      if (typeof filter === 'string') {
        try {
          filter = JSON.parse(filter);
        } catch (e) {
          msg.payload.error = e;
          return node.send(msg);
        }
      }
      if (Model) {
        Model.find(filter).then(result => {
          msg.payload.result = result;
          node.send(msg);
        });
      } else {
        msg.payload.error = "No Model";
        node.send(msg);
      }
    });
  }
  RED.nodes.registerType("lb-find", FindNode);
};
