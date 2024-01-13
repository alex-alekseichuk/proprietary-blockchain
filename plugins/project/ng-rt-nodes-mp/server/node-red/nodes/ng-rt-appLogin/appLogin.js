'use strict';

var logger = require('log4js').getLogger('appLogin');
const {digitalAssetApi, apiUtil} = require('ng-rt-digitalAsset-sdk');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function appLogin(config) {
    logger.debug('login to TBSP via application key');
    RED.nodes.createNode(this, config);
    
    this.on('input', async function(msg) {
      // var self = this;
      try {
        const txContext = msg.payload;

        const appKey = msg.appKey;
        
        const pluginInfo = await digitalAssetApi.getPluginConfiguration(txContext);

        if (pluginInfo.routeValidation === true) {
          let headers = {
            'Content-Type': 'application/json'
          };
  
          let options = {
              url: txContext.serverEnvironment.serverUrl + '/auth/applogin',
              method: 'POST',
              body: {
                appID: "ng-rt-digitalAsset",
                appKey: appKey
              },
              headers: headers,
              json: true
          }
          
          let token = await apiUtil.getToken(options);
          txContext.jwtToken = token;
          msg.payload = txContext;
        }else {
          logger.info('validation is off');
          msg.payload = txContext;
        }

      } catch (error) {
        logger.error(error.message);
        msg.payload = {
          message: error.message
        };
      }
      this.send(msg);
    });
  }

  RED.nodes.registerType("appLogin", appLogin);
};
