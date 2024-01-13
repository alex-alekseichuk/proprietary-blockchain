'use strict';

var logger = require('log4js').getLogger('transfer-digitalAsset');
const {digitalAssetDriver} = require('ng-rt-digitalAsset-sdk');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function transferDigitalAsset(config) {
    logger.debug('register transfer digital asset');
    RED.nodes.createNode(this, config);

    this.on('input', async function(msg) {
      try {
        const createTxResult = await digitalAssetDriver.transferDigitalAsset(msg.payload.txContext,
          msg.payload.unspentTransactionId,
          msg.payload.txMetadata,
          msg.payload.publicKey,
          msg.payload.privateKey,
          msg.payload.receiverPublicKey);

        msg.payload = createTxResult.result.hash;
      } catch (error) {
        msg.payload = {
          statusCode: error.statusCode,
          message: error.message
        };
      }
      this.send(msg);
    });
  }

  RED.nodes.registerType("transfer-digitalAsset", transferDigitalAsset);
};
