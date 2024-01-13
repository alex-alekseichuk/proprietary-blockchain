'use strict';

var logger = require('log4js').getLogger('userLogin');
const {apiUtil} = require('ng-rt-digitalAsset-sdk');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function userLogin(config) {
    logger.debug('register to TBSP via username/password');
    RED.nodes.createNode(this, config);
    var adminUsername = config.adminUsername;
    var adminPassword = config.adminPassword;

    this.on('input', async function(msg) {
      // var self = this;
      try {
        logger.debug('msg =', msg);
        let txContext = msg.txContext;
        let headers = {
          'Content-Type': 'application/json'
        };

        let options = {
            url: txContext.serverEnvironment.serverUrl + '/auth/login',
            method: 'POST',
            body: {
              username: adminUsername,
              password: adminPassword
            },
            headers: headers,
            json: true
        }
        let token = await apiUtil.getToken(options);
        txContext.jwtToken = token;
        msg.payload = txContext;
        
      } catch (error) {
        msg.payload = {
          statusCode: error.statusCode,
          message: error.message
        };
      }
      this.send(msg);
    });
  }

  RED.nodes.registerType("userLogin", userLogin);
};
