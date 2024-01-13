'use strict';

var logger = require('log4js').getLogger('create-digitalAsset');
const {digitalAssetDriver} = require('ng-rt-digitalAsset-sdk');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function createAsset(config) {
    logger.debug('register create digital asset module');
    RED.nodes.createNode(this, config);

    this.on('input', async function(msg) {
      try {
        const createTxResult = await digitalAssetDriver.createDigitalAsset(msg.payload.txContext,
          msg.payload.digitalAssetData,
          msg.payload.amount,
          msg.payload.txMetadata,
          msg.payload.publicKey,
          msg.payload.privateKey);

        msg.payload = createTxResult.result.hash;
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

  RED.nodes.registerType("create-digitalAsset", createAsset);
};
