'use strict';
/**
 * Created by alibe on 18.08.2016.
 */
var logger = require('log4js').getLogger('decrypt-by-privatekey');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function decryptNode(config) {
    logger.debug('register decrypt-by-privatekey');
    RED.nodes.createNode(this, config);
    var pubkey = config.pubkey;
    var prvkey = config.prvkey;
    var content = config.content;

    var decrypt = (content, publickey, privatekey) => {
      return new Promise((resolve, reject) => {
        var service = global.serviceManager.get('keys');
        return resolve(service.async_decrypt(content, publickey, privatekey));
      });
    };

    this.on('input', function(msg) {
      if (msg.decrypt_by_privatekey) {
        if (msg.decrypt_by_privatekey.pubkey)
          pubkey = msg.decrypt_by_privatekey.pubkey;
        if (msg.decrypt_by_privatekey.prvkey)
          prvkey = msg.decrypt_by_privatekey.prvkey;
        if (msg.decrypt_by_privatekey.content)
          content = msg.decrypt_by_privatekey.content;
      }
      decrypt(content, pubkey, prvkey).then(decrypted => {
        this.log("decrypted");
        if (msg.decrypt_by_privatekey)
          msg.decrypt_by_privatekey.result = decrypted;
        else
          msg.msg.decrypt_by_privatekey = {result: decrypted};
        this.send(msg);
      }).catch(err => {
        this.error("Not decrypted", err);
      });
    });
  }

  RED.nodes.registerType("decrypt-by-privatekey", decryptNode);
};
