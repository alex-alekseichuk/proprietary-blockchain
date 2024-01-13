/**
 * Created by alibe on 18.08.2016.
 */
'use strict';

const loopback = require('loopback');
// const logger = require('log4js').getLogger('email-template-sender');

module.exports = function(RED) {
  /**
   * Email template sender node
   * @param {Object} config - configuration of node
   */
  function sendEmailNode(config) {
    RED.nodes.createNode(this, config);
    const emailSendModel = loopback.findModel('emailSend');
    this.on('input', function(msg) {
      let recepient = config.recepient || msg.ctx.recepient;
      let template = config.template || msg.ctx.template;
      let payload = config.payload || msg.ctx.payload;
      let recepients = Array.isArray(recepient) ? recepient : [recepient];
      return Promise.all(recepients.map(
        recepient => emailSendModel.create({emails: recepient, template, payload})
          .then(() => {
            this.log("Email template-sended");
            this.send(msg);
          })
          .catch(err => {
            this.error("Email template- not sended", err);
          })
      ));
    });
  }

  RED.nodes.registerType("email-template-sender", sendEmailNode);
};
