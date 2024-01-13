'use strict';
/**
 * Created by alibe on 18.08.2016.
 */
var logger = require('log4js').getLogger('encrypt-by-publickey');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function encryptNode(config) {
    logger.debug('register encrypt-by-publickey');
    RED.nodes.createNode(this, config);
    var key = config.key;
    var content = config.content;

    var encrypt = (content, publickey) => {
      return new Promise(resolve => {
        var service = global.serviceManager.get('keys');

        return resolve(service.async_encrypt(content, service.pubenc(service.bs58_decode(publickey))));
      });
    };

    this.on('input', function(msg) {
      if (msg.ctx.publicKey) {
        key = msg.ctx.publicKey;
        if (msg.ctx.payload)
          content = new Buffer(msg.ctx.payload);
      }

      encrypt(content, key).then(encrypted => {
        this.log("encrypted");
        msg.ctx.payload = new Buffer(encrypted);
        this.send(msg);
      }).catch(err => {
        this.error("Not encrypted", err);
      });
    });
  }

  RED.nodes.registerType("encrypt-by-publickey", encryptNode);
};
