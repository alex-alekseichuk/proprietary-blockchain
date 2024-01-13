/**
 * Created by alibe on 18.08.2016.
 */

'use strict';

const logger = require('log4js').getLogger('red.aes-encrypt');

module.exports = function(RED) {
  /**
   * AES encrypt node
   * @param {Object} config - configuration of node
   */
  function getAESEncrypt(config) {
    RED.nodes.createNode(this, config);

    let encrypt = buffer => {
      let service = global.serviceManager.get('aes256');
      return service.encryptBuffer(buffer);
    };

    this.on('input', function(msg) {
      logger.debug('input aes encrypt', msg);

      msg.ctx.payload = encrypt(new Buffer(msg.ctx.payload.data));
      logger.debug('encrypted=', msg.ctx.payload);
      this.log("Encrypted by aes: ", msg.ctx.payload);
      this.send(msg);
    });
  }

  RED.nodes.registerType("aes-encrypt", getAESEncrypt);
};
