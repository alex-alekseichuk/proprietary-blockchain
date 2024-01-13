'use strict';

const logger = require('log4js').getLogger('commands.blockchain.services.checkTx');
const checkTxHook = require('./checkTxHook');
const nodeRedCheckTx = require('./nodeRedCheckTx');
const Base64 = require('js-base64').Base64;
const {sha256Hash: {createUpdateHash}} = require("ng-crypto");

module.exports = async (services, parsedTx) => {
  logger.debug('commands.blockchain.services.checkTx');
  const metricsClient = services.get('metricsClient');
  try {
    let pluginManager = services.get('loopbackApp').plugin_manager;
    let pluginSettings = pluginManager.configs.get('ng-rt-abci-server');
    const isCheckTxEnabled = pluginSettings.get('checkTx');
    if (isCheckTxEnabled) {
      const isFungible = parsedTx.assetDescriptor.isFungible;
      if (isFungible == false) {
        let data = JSON.stringify(parsedTx.tx.asset);
        let generateHash = createUpdateHash(data);
        if (generateHash == parsedTx.assetDescriptor.assetHash) {
          logger.info('Result of asset Hash verification:  true');
        } else
            return {
              code: -1,
              log: 'asset hash verification failed'
            };
      }
      switch (parsedTx.assetDescriptor.assetType) {
        default:
          break;
        case 'smartContract': {
          let tx;
          tx = parsedTx.tx;
          let smartContractsCheck = await checkTxHook.smartContractsCheck(services, tx);
          let smartContractRes = await nodeRedCheckTx.nodeRedCheck(services, tx.id, smartContractsCheck);
          return smartContractRes;
        }
      }
    }
    metricsClient.increment(`CheckTx, isValid=true`);
    return {
      code: 0,
      log: 'OK',
      data: Base64.encode(JSON.stringify(parsedTx.tx))
    };
  } catch (error) {
    logger.error(error.message);
    metricsClient.increment(`CheckTx, isValid=false, error=${error.message}`);
    throw error;
  }
};
