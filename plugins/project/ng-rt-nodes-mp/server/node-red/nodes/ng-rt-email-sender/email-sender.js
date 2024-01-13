/**
 * Created by alibe on 18.08.2016.
 */

'use strict';

const loopback = require('loopback');
const logger = require('log4js').getLogger('email-sender');

module.exports = function(RED) {
  /**
   * Email sender node
   * @param {Object} config - configuration of node
   */
  function sendEmailNode(config) {
    RED.nodes.createNode(this, config);
    let recepient = config.recepient;
    let message = config.message;
    let subject = config.subject;
    let attachments;

    this.on('input', function(msg) {
      logger.debug('input send email', recepient, message, config);
      if (msg.ctx.recepient)
        recepient = msg.ctx.recepient;
      if (msg.ctx.subject)
        subject = msg.ctx.subject;
      if (msg.ctx.mailmessage) {
        message = msg.ctx.mailmessage;
      }
      if (msg.ctx.attachments)
        attachments = msg.ctx.attachments;
      const emailSendModel = loopback.findModel('emailSend');
      let recepients = Array.isArray(recepient) ? recepient : [recepient];
      return Promise.all(recepients.map(
        recepient => emailSendModel.create({emails: recepient, body: message, subject: subject, attachments: attachments})
        .then(() => {
          this.log("Email sended");
          this.send(msg);
        })
        .catch(err => {
          this.error("Email not sended " + (err.message ? err.message : err));
        })
      ));
    });
  }

  RED.nodes.registerType("email-sender", sendEmailNode);
};
