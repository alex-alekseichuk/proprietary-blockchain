"use strict";

const logger = require("log4js").getLogger(
  "commands.blockchain.services.deliverTx"
);
const {INFO, CODE} = require("../../../../config/abciResponse.js");
const {validatorUpdate} = require("../utils/validatorUpdate");
const {create, compose} = require("../dataService/dataHandler");
const {validateTx} = require("./validate");
let loopbackModels={}

/**
 * Persists data to the DB by extracting the data from the data object and passing it to the models.
 * 
 * @param {object} data Parsed transaction data to be persisted
 */
const persistData = async function(data){
  try {
    const {tmAsset: tmAssetModel, txInput: txInputModel, txOutput: txOutputModel, tmMetadata: tmMetadataModel, tmTx: tmTxModel} = loopbackModels;
    const {tmTx: tmTxData, tmAsset: tmAssetData, tmMetadata: tmMetadataData, txInput: txInputData, txOutput: txOutputData} = compose(data);
    await create(txInputModel, txInputData);
    await create(txOutputModel, txOutputData); 
    await create(tmAssetModel, tmAssetData);
    await create(tmMetadataModel, tmMetadataData);
    await create(tmTxModel, tmTxData);  
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

module.exports = async (services, parsedTx, currentTxs) => {
  logger.debug("commands.blockchain.services.deliverTx");
  const metricsClient = services.get("metricsClient");
  const rabbitmq = services.get('rabbitMQ');
  loopbackModels = services.get("loopbackApp").models;
  try {
    const pluginManager = services.get('loopbackApp').plugin_manager;
    const pluginSettings = pluginManager.configs.get('ng-rt-abci-server');
    const isDeliverTxEnabled = pluginSettings.get('deliverTx');
    const {validatorSet: validatorSetModel} = loopbackModels;
    if (parsedTx.assetDescriptor.assetType === "valUpdateReq") {
      const validatorData = {
        power: parsedTx.tx.asset.data.power,
        pubKey: {
          data: parsedTx.tx.asset.data.pubKey,
          type: parsedTx.tx.asset.data.type
        }
      };
      await persistData(parsedTx);
      const valResult = await validatorUpdate(validatorData, validatorSetModel);
      metricsClient.increment("DeliverTx, isValid=true");
      return {
        deliverTxRes: {
          code: CODE.ok,
          log: `DeliverTx ${INFO.success}`,
          data: parsedTx.tx.id
        },
        validator: valResult
      };
    }
    if (isDeliverTxEnabled) {
      await validateTx(loopbackModels, parsedTx.tx, currentTxs);
    }
    // in case of smartContract publish tx to queue
    if (parsedTx.assetDescriptor.assetType === "smartContract") {
      let configService = services.get("configService");
      let rabbitmq = services.get('rabbitMQ');
      rabbitmq.publishQueue(configService.get('rabbitmq_ws_queue'), parsedTx.tx);
    }

    await persistData(parsedTx);

    if (parsedTx.assetDescriptor.assetType === "document_sharing") {
      rabbitmq.publishQueue('abciServer', parsedTx.tx);
    }

    let rabbitmqPublisher = services.get('ng-rt-abci-server-rabbitmq-publisherService');
    if (rabbitmqPublisher)
      rabbitmqPublisher.deliverTx(parsedTx);

    metricsClient.increment(`DeliverTx, isValid=true`);
    return {
      deliverTxRes: {
        code: CODE.ok,
        log: `DeliverTx ${INFO.success}`,
        data: parsedTx.tx.id
      }
    };
  } catch (err) {
    logger.error(err.message);
    metricsClient.increment("DeliverTx, isValid=false");
    throw err;
  }
};
