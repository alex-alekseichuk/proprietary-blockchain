'use strict';

var logger = require('log4js').getLogger('find-asset-by-property');
const {digitalAssetApi} = require('ng-rt-digitalAsset-sdk');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function findAssetByProperty(config) {
    logger.debug('register create digital asset module');
    RED.nodes.createNode(this, config);

    this.on('input', async function(msg) {
      try {
        const getAssetByMetadata = await digitalAssetApi.findAssetByProperty(msg.payload.txContext, msg.payload.property, msg.payload.value);
        logger.debug('Asset is', getAssetByMetadata);

        msg.payload = getAssetByMetadata;
      } catch (error) {
        msg.payload = {
          statusCode: error.statusCode,
          message: error.message
        };
      }
      this.send(msg);
    });
  }

  RED.nodes.registerType("find-asset-by-property", findAssetByProperty);
};
