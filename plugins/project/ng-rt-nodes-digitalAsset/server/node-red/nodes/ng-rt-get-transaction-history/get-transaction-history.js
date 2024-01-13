'use strict';

var logger = require('log4js').getLogger('get-transaction-history');
const {digitalAssetApi} = require('ng-rt-digitalAsset-sdk');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function getTransactionHistory(config) {
    logger.debug('register get transaction history');
    RED.nodes.createNode(this, config);

    this.on('input', async function(msg) {
      try {
        // get Txs history
        const getTxHistory = await digitalAssetApi.getTxHistory(msg.payload.txContext, msg.payload.publicKey);
        logger.debug('transactions history for alice is', getTxHistory);
        // console.log(getTxHistoryAlice);
        msg.payload = getTxHistory;
      } catch (error) {
        msg.payload = {
          statusCode: error.statusCode,
          message: error.message
        };
      }
      this.send(msg);
    });
  }

  RED.nodes.registerType("get-transaction-history", getTransactionHistory);
};
