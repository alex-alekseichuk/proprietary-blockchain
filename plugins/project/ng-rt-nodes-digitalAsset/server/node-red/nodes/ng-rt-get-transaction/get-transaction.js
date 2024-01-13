'use strict';

var logger = require('log4js').getLogger('get-transaction');
const {digitalAssetApi} = require('ng-rt-digitalAsset-sdk');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function getTransaction(config) {
    logger.debug('register create digital asset module');
    RED.nodes.createNode(this, config);

    this.on('input', async function(msg) {
      try {
        const getTxById = await digitalAssetApi.getTxById(msg.payload.txContext, msg.payload.txId);
        logger.debug('transactions history for alice is', getTxById);
        msg.payload = getTxById;
      } catch (error) {
        msg.payload = {
          statusCode: error.statusCode,
          message: error.message
        };
      }
      this.send(msg);
    });
  }

  RED.nodes.registerType("get-transaction", getTransaction);
};
