'use strict';

var logger = require('log4js').getLogger('get-asset-by-owner');
const {digitalAssetApi} = require('ng-rt-digitalAsset-sdk');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function getAssetByOwner(config) {
    logger.debug('register create digital asset module');
    RED.nodes.createNode(this, config);

    this.on('input', async function(msg) {
      try {
        const createTxResult = await digitalAssetApi.getAssetsByOwner(msg.payload.txContext, msg.payload.publicKey);

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

  RED.nodes.registerType("get-asset-by-owner", getAssetByOwner);
};
