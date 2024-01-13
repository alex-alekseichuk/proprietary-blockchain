'use strict';
/* eslint-disable complexity */

const loopback = require('loopback');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function UpdateNode(config) {
    RED.nodes.createNode(this, config);
    let node = this;
    let modelName = config.modelname;
    var Model = loopback.findModel(modelName);

    node.on('input', function(msg) {
      if (typeof msg.payload !== 'object')
        msg.payload = {};
      let where = msg.payload.where || config.where || {};
      let data = msg.payload.data || config.data || {};
      if (!where)
        where = {};
      if (!data)
        data = {};
      if (typeof where === 'string') {
        try {
          where = JSON.parse(where);
        } catch (e) {
          msg.payload.error = e;
          return node.send(msg);
        }
      }
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          msg.payload.error = e;
          return node.send(msg);
        }
      }
      if (Model) {
        Model.updateAll(where, data).then(result => {
          msg.payload.result = result;
          node.send(msg);
        });
      } else {
        msg.payload.error = "No Model";
        node.send(msg);
      }
    });
  }
  RED.nodes.registerType("lb-update", UpdateNode);
};
