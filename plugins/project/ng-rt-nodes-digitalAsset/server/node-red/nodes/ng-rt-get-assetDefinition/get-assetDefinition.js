'use strict';

var logger = require('log4js').getLogger('get-assetDefinition');
const {digitalAssetApi} = require('ng-rt-digitalAsset-sdk');
module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function getAssetDefinition(config) {
    logger.debug('register get digital asset definition');
    RED.nodes.createNode(this, config);

    this.on('input', async function(msg) {
      try {
        const getDefintion = await digitalAssetApi.getAssetDefinition(msg.payload.txContext);

        msg.payload = getDefintion;
      } catch (error) {
        msg.payload = {
          statusCode: error.statusCode,
          message: error.message
        };
      }

      this.send(msg);
    });
  }

  RED.nodes.registerType("get-assetDefinition", getAssetDefinition);
};
