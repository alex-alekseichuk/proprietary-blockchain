'use strict';

var logger = require('log4js').getLogger('get-asset-history');
const {digitalAssetApi} = require('ng-rt-digitalAsset-sdk');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function getAssetHistory(config) {
    logger.debug('register create digital asset module');
    RED.nodes.createNode(this, config);

    this.on('input', async function(msg) {
      try {
        const getAssetHistory = await digitalAssetApi.getAssetHistory(msg.payload.txContext, msg.payload.assetId);

        msg.payload = getAssetHistory;
      } catch (error) {
        msg.payload = {
          statusCode: error.statusCode,
          message: error.message
        };
      }
      this.send(msg);
    });
  }

  RED.nodes.registerType("get-asset-history", getAssetHistory);
};
