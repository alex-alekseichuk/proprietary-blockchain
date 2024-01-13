/**
 * Created by alibe on 18.08.2016.
 */
'use strict';

const loopback = require('loopback');
const logger = require('log4js').getLogger('get-mailtemplate');

module.exports = function(RED) {
  /**
   * Email template sender node
   * @param {Object} config - configuration of node
   */
  function getMailtemplateNode(config) {
    logger.debug('register get-mailtemplate module');
    RED.nodes.createNode(this, config);
    const emailTemplateModel = loopback.findModel('emailTemplate');
    this.on('input', function(msg) {
      let name = config.name || msg.ctx.mailtemplate;
      emailTemplateModel.findOne({where: {name: name}}).then(template => {
        msg.ctx.mailtemplate = template;
        this.send(msg);
      }).catch(err => {
        this.error("Email not goted", err);
        this.send(msg);
      });
    });
  }

  RED.nodes.registerType("get-mailtemplate", getMailtemplateNode);
};
