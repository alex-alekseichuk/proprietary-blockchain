"use strict";

const events = require("events");
const logger = require("log4js").getLogger("ng-rt-smartContracts.worldState");

module.exports = function(services, __confirmationEvents, __blockchainCache) {
  let models = services.get("loopbackApp").models;
  let configService = services.get("configService");
  let rabbitmq = services.get("rabbitMQ");

  let eventEmitter = new events.EventEmitter();

  this.connect = () => eventEmitter;

  this.processTx = tx => processTx(tx);

  rabbitmq.subscribeToQueue(
    configService.get("rabbitmq_ws_queue"),
    (message, headers, deliveryInfo, messageObject) => {
      let tx = JSON.parse(message);
      processTx(tx);
    },
    () => {
      logger.info("world state connected to rabbit");
    }
  );

  /**
   * Insert contract memory to a cache table called "world state"
   * @param {object} memory Object which contains created contract memory
   */
  function insertContract(memory) {
    models.worldState.create(memory).then(result => {
      logger.info("world state - inserted");
      eventEmitter.emit("contract:inserted", result);
    });
  }

  /**
   * Update contract memory in a cache table called "world state"
   * @param {string} contractId ID of the contract
   * @param {object} memory Object which contains updated contract memory
   */
  function updateContract(contractId, memory) {
    models.worldState
      .updateAll({contractId: contractId}, {memory: memory})
      .then(() => {
        logger.info("world state - updated");
        eventEmitter.emit("contract:updated", {
          contractId: contractId,
          memory: memory
        });
      });
  }

  /**
   * Insert contract published contract data  to a table called scTemplate
   * @param {object} templatePublishData Object which contains created contract memory
   */
  function insertContractDetails(templatePublishData) {
    models.scTemplate
      .create(templatePublishData)
      .then(result => {
        logger.info("SCTemplate");
        eventEmitter.emit("SCTemplatePublished:inserted", result);
      })
      .catch(err => {
        logger.error(err.message);
      });
  }

  /**
   * Insert contract instance update data to table "scInstance"
   * @param {object} instanceData Object which contains created contract memory
   */
  function insertContractUpdateDetails(instanceData) {
    models.scInstance
      .upsert(instanceData)
      .then(result => {
        logger.info("SCInstances");
        eventEmitter.emit("SCInstances:inserted", result);
      })
      .catch(err => {
        logger.error(err.message);
      });
  }

  /**
   * Process new TX
   * @param {object} transaction transaction data
   * @return {object} data data
   */
  function processTx(transaction) {
    try {
      let modelObj;
      let ownerPublicKeys = [];
      if (transaction.asset.data && transaction.asset.data.contractCreation) {
        for (let output of transaction.outputs) {
          ownerPublicKeys = ownerPublicKeys.concat(output.public_keys);
        }
        modelObj = {
          type: "contractCreation",
          source: transaction.asset.data.contractCreation.source,
          memory: transaction.asset.data.contractCreation.memory,
          txId: transaction.id,
          address: transaction.id,
          sourceHash: transaction.asset.data.contractCreation.sourceHash,
          hashRandomizer: transaction.asset.data.contractCreation.hashRandomizer,
          ownerPublicKeys
        };

        insertContractDetails(modelObj);
        let memory = transaction.asset.data.contractCreation.memory;
        return insertContract({
          contractId: transaction.id,
          memory: memory
        });
      } else if (
        transaction.asset.data &&
        transaction.asset.data.contractUpdate
      ) {
        for (let output of transaction.outputs) {
          ownerPublicKeys = ownerPublicKeys.concat(output.public_keys);
        }
        modelObj = {
          type: "contractUpdate",
          address: transaction.asset.data.contractUpdate.address,
          memory: transaction.asset.data.contractUpdate.memory,
          functionName: transaction.asset.data.contractUpdate.functionName,
          args: transaction.asset.data.contractUpdate.args,
          txId: transaction.id,
          ownerPublicKeys
        };
        insertContractUpdateDetails(modelObj);
        let memory = transaction.asset.data.contractUpdate.memory;
        let address = transaction.asset.data.contractUpdate.address;
        return updateContract(address, memory);
      } else if (
        transaction.operation == "TRANSFER" &&
        transaction.metadata.contractUpdate
      ) {
        for (let output of transaction.outputs) {
          ownerPublicKeys = ownerPublicKeys.concat(output.public_keys);
        }
        modelObj = {
          type: "contractUpdate",
          address: transaction.metadata.contractUpdate.address,
          memory: transaction.metadata.contractUpdate.memory,
          txId: transaction.id,
          functionName: transaction.metadata.contractUpdate.functionName,
          args: transaction.metadata.contractUpdate.args,
          ownerPublicKeys
        };
        insertContractUpdateDetails(modelObj);
        let memory = transaction.metadata.contractUpdate.memory;
        let address = transaction.metadata.contractUpdate.address;
        return updateContract(address, memory);
      }

      logger.info("TX " + transaction.id + " not related to smart contract");
    } catch (error) {
      logger.error(error.message);
    }
  }
};
