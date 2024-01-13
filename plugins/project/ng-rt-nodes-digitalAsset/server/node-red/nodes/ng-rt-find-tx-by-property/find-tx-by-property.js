'use strict';

var logger = require('log4js').getLogger('find-tx-by-property');
const {digitalAssetApi} = require('ng-rt-digitalAsset-sdk');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function findTxByProperty(config) {
    logger.debug('find transaction by property');
    RED.nodes.createNode(this, config);

    this.on('input', async function(msg) {
      try {
        const getAssetByMetadata = await digitalAssetApi.findTxByProperty(msg.payload.txContext, msg.payload.property, msg.payload.value);
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

  RED.nodes.registerType("find-tx-by-property", findTxByProperty);
};
