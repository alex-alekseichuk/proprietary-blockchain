'use strict';
const loopback = require('loopback');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function DestroyNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let modelName = config.modelname;
    var Model = loopback.findModel(modelName);

    node.on('input', function(msg) {
      if (typeof msg.payload !== 'object') {
        try {
          msg.payload = {};
        } catch (e) {
          msg.payload.error = e;
          return node.send(msg);
        }
      }
      let where = msg.payload.where || config.where || {};
      if (!where)
        where = {};
      if (typeof where === "string")
        where = JSON.parse(where);
      if (Model) {
        Model.destroyAll(where).then(result => {
          msg.payload.result = result;
          node.send(msg);
        });
      } else {
        msg.payload.error = "No Model";
        node.send(msg);
      }
    });
  }
  RED.nodes.registerType("lb-destroy-all", DestroyNode);
};
