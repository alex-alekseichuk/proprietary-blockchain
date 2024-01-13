'use strict';

const logger = require('log4js').getLogger('ng-rt-abci-server.services.abci-client');

/**
 * API/Service/ng-rt-abci-client
 *
 * @module API/Service/ng-rt-abci-client
 * @type {Object}
 */

const tmTxDS = require('./../commands/blockchain/dataService/tmTxDS');
const tmAssetDS = require('./../commands/blockchain/dataService/tmTxDSAsset');

module.exports = services => {
  const models = services.get("loopbackApp").models;

  let i18n = services.get("i18n");

  logger.debug(i18n.__("activate service abci-client"));

  return {

    /**
     * Reads transaction by Id
     * @param {string} txId the transaction id
     * @return {Promise} the tx object or null if the transaction  can't be found
     */
    getTxById(txId) {
      logger.debug('Fetching TmTx with id ' + txId);
      return tmTxDS.findOne(models.tmTx, txId);
    },

    /**
     * Reads asset by Id
     * @param {string} assetId the asset id (asset id is equal to the txId of the corresponding CREATE transaction)
     * @return {Promise} the asset object or null if the asset can't be found
     */
    getAssetById(assetId) {
      logger.debug('Fetching tmAsset with id ' + assetId);
      return tmAssetDS.findOne(models.tmAsset, assetId);
    }
  };
};
