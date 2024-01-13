/**
 * Created by alibe on 18.08.2016.
 */

'use strict';

const logger = require('log4js').getLogger('email-bykey');

module.exports = function(RED) {
  /**
   * Email bykey node
   * @param {Object} config - configuration of node
   */
  function getEmailByKey(config) {
    logger.debug('register email bykey  module');
    RED.nodes.createNode(this, config);
    let key = config.key;

    let getByKey = key => {
      let service = global.serviceManager.get('pubkeys');
      return service.getUserByKey(key);
    };

    this.on('input', function(msg) {
      logger.debug('input get email by', key);

      let userPubKey = msg.ctx.key || key;
      if (msg.userpubkeytogetemail)
        userPubKey = msg.userpubkeytogetemail;

      getByKey(userPubKey).then(user => {
        msg.ctx.recepient = user.email;
        logger.debug('email=', user.email);
        this.log("Email get: ", user.email);
        this.send(msg);
      }).catch(err => {
        this.error("Email not goted", err);
        this.send(msg);
      });
    });
  }

  RED.nodes.registerType("email-bykey", getEmailByKey);
};
