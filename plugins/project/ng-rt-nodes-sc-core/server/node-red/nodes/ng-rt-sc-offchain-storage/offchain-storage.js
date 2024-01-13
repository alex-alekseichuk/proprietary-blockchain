/* eslint-disable */
var loopback = require('loopback');
var logger = require('log4js').getLogger('offchain-local-isolated-memory');

module.exports = function (RED) {
  /**
   * 
   * @param {*} config Config
   */
  function offchainNode(config) {

    RED.nodes.createNode(this, config);
    var recepient = config.recepient;
    var template = config.template;
    var payload = config.payload;

    var insert = (key, value) => {
      return new Promise(response => {
        let Model = global.serviceManager.get('loopbackApp').models.localIsolatedMemory;
        logger.info('create model');
        return response(Model.create({ key: key, value: value }));
      });
    };

    var update = (key, value) => {
      return new Promise(response => {
        let Model = global.serviceManager.get('loopbackApp').models.localIsolatedMemory;
        logger.info('update model');
        Model.updateAll({ key: key }, { value: value }, function (err, data) {
          return response(data);
        });
      });
    };

    this.on('input', function (msg) {

      if (msg.ctx && msg.ctx.value) // INSERT
      {
        insert(msg.env.ownContractId + msg.ctx.key, msg.ctx.value).then(body => {
          this.send(msg);
        }).catch(err => {
          this.error("not saved", err);
        });
      }
      else if (msg.ctx && msg.ctx.update_key) // UPDATE
      {
        update(msg.env.ownContractId + msg.ctx.update_key, msg.ctx.update_value).then(body => {
          this.send(msg);
        }).catch(err => {
          this.error("not saved", err);
        });
      }
      else // FIND
      {

        var self = this;
        let Model = global.serviceManager.get('loopbackApp').models.localIsolatedMemory;
        Model.find({ where: { key: msg.env.ownContractId + msg.ctx.key } }, function (err, data) {

          if (data && data[0] && data[0].value) {
            msg.payload = data[0].value;
          }
          else {
            msg.payload = false;
          }

          self.send(msg);

        });
      }
    });
  }

  RED.nodes.registerType("offchain-storage", offchainNode);
}
