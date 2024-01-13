'use strict';

var logger = require('log4js').getLogger('get-owner-of-asset');
const {digitalAssetApi} = require('ng-rt-digitalAsset-sdk');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function getOwnerOfAsset(config) {
    logger.debug('get owner of a digital asset');
    RED.nodes.createNode(this, config);

    this.on('input', async function(msg) {
      try {
        const createTxResult = await digitalAssetApi.getOwnerOfAsset(msg.payload.txContext, msg.payload.assetId);

        msg.payload = createTxResult;
      } catch (error) {
        logger.error(error.message);
        msg.payload = {
          statusCode: error.statusCode,
          message: error.message
        };
      }
      this.send(msg);
    });
  }

  RED.nodes.registerType("get-owner-of-asset", getOwnerOfAsset);
};
