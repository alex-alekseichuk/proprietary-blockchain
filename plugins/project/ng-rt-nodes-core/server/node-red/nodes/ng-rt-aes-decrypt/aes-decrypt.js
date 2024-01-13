/**
 * Created by alibe on 18.08.2016.
 */

'use strict';

const logger = require('log4js').getLogger('red.aes-decrypt');

module.exports = function(RED) {
  /**
   * AES decrypt node
   * @param {Object} config - configuration of node
   */
  function getAESdecrypt(config) {
    RED.nodes.createNode(this, config);

    let decrypt = buffer => {
      let service = global.serviceManager.get('aes256');
      return service.decryptBuffer(buffer);
    };

    this.on('input', function(msg) {
      logger.debug('input aes decrypt', msg);

      msg.ctx.payload = decrypt(new Buffer(msg.ctx.payload));
      logger.debug('decrypted=', msg.ctx.payload);
      this.log("decrypted by aes: ", msg.ctx.payload);
      this.send(msg);
    });
  }

  RED.nodes.registerType("aes-decrypt", getAESdecrypt);
};
