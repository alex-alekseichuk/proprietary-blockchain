'use strict';
const loopback = require('loopback');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function CreateNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let modelName = config.modelname;
    var Model = loopback.findModel(modelName);

    node.on('input', function(msg) {
      if (typeof msg.payload !== 'object')
        msg.payload = {};
      let obj = msg.payload.object || config.object || {};
      if (!obj)
        obj = {};
      if (typeof obj === 'string') {
        try {
          obj = JSON.parse(obj);
        } catch (e) {
          msg.payload.error = e;
          return node.send(msg);
        }
      }
      if (Model) {
        Model.create(obj).then(result => {
          msg.payload.result = result;
          node.send(msg);
        });
      } else {
        msg.payload.error = "No Model";
        node.send(msg);
      }
    });
  }
  RED.nodes.registerType("lb-create", CreateNode);
};
