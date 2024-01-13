/**
 * Created by alibe on 18.08.2016.
 */

'use strict';

const logger = require('log4js').getLogger('byemail-key');

module.exports = function(RED) {
  /**
   * Byemail key node
   * @param {Object} config - configuration of node
   */
  function getKeyByEmail(config) {
    RED.nodes.createNode(this, config);
    let email = config.email;
    let getByEmail = email => {
      let service = global.serviceManager.get('pubkeys');
      return service.getKeyByEmail(email);
    };
    this.on('input', function(msg) {
      logger.debug('input get key by', email);

      let userEmail = msg.ctx.key || email;
      if (msg.useremailtogetkey) {
        userEmail = msg.useremailtogetkey;
      }

      getByEmail(userEmail).then(key => {
        msg.ctx.pubkey = key.key;
        logger.debug('key=', key.key);
        this.log("Key get: ", key.key);
        this.send(msg);
      }).catch(err => {
        this.error("Key not goted", err);
        this.send(msg);
      });
    });
  }

  RED.nodes.registerType("byemail-key", getKeyByEmail);
};
