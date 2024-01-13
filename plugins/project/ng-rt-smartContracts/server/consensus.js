'use strict';

const logger = require('log4js').getLogger('ng-rt-smartContracts.consensus');
const WorldStateModule = require('./worldState');
const events = require('events');

var confirmationEvents = new events.EventEmitter();

let smartContract;
let projectBlockchain;
let unconfirmedMemory;
let worldState;
let configService;

/**
 * Function to configure a module
 * @param {object} __unconfirmedMemory __unconfirmedMemory
 * @ignore
 */
function configure(__unconfirmedMemory) {
  unconfirmedMemory = __unconfirmedMemory;
}

/** Check the execution strategy
 * @param {string} changedContract ContractId
 * @param {string} functionName functionName
 * @param {string} args args
 * @param {string} callerPubKey callerPubKey
 * @param {object} remoteIp remoteIp
 * @param {object} transferData transferData
 * @return {object} result
 */
async function checkStrategy(changedContract, functionName, args, callerPubKey, remoteIp, transferData) {
  let result;
  const strategy = configService.get('scExecutionStrategy');
  switch (strategy) {
    case 'seperateFlow':
      result = await smartContract.execute(changedContract, functionName, args, callerPubKey, remoteIp, transferData);
      return result;

    case 'existingFlow':
      result = await smartContract.executeWithoutTab(
				changedContract,
				functionName,
				args,
				callerPubKey,
				false,
				transferData
			);
      return result;

    default:
      result = await smartContract.execute(changedContract, functionName, args, callerPubKey, remoteIp, transferData);
      return result;
  }
}

/** Check the consensus
 * @param {Object} tx Transaction to be validated
 * @return {type} JSON returncodes
 */
async function checkTx(tx) {
  logger.debug('tx for validation:');
  logger.debug(tx);

  logger.debug('CONSENSUS TX:', tx.id);

  if (tx.operation == 'CREATE') {
		// In case of update
    if (tx.asset.data.contractUpdate) {
      logger.info('UPDATE CONTRACT.');
      let data = tx.asset.data.contractUpdate;
      let changedContract = data.address;
      let memory = data.memory;
      let args = data.args;
      let functionName = data.functionName;
      let previousCallId = data.previousCallId;
			/** *
			* *
			* *    CREATE TRANSACTION CALL
			*
			*/
      logger.info('changedContract:', changedContract);
      logger.info('call args:', args);
      logger.info('tx send new memory:');
      logger.info(JSON.stringify(memory));

      let callerPubKey = tx.inputs[0].owners_before[0]; /* TODO [0] */
			/*
            if execution happens in one block - reject transaction which consist a link to old previous TX
	        */

      if (
				unconfirmedMemory[changedContract] &&
				previousCallId !== unconfirmedMemory[changedContract].latestTxId
			) {
        logger.debug(
					'CHECK TX LINKS:',
					previousCallId,
					'>>>>>>>>>',
					unconfirmedMemory[changedContract].latestTxId
				);
        logger.error('consensus FAIL');

        return 'Failed';
      }

      let result = await checkStrategy(changedContract, functionName, args, callerPubKey, false, false);

      result = JSON.parse(result);

      if (JSON.stringify(result.memory) === JSON.stringify(memory)) {
        logger.debug('CALL OK');

        unconfirmedMemory[changedContract] = {
          memory: memory,
          latestTxId: tx.id
        };

        logger.info('consensus NEXT');
        return 'NEXT';
				// TODO!: chance that TX will not be passed via bigchaindb checks */
      }
      logger.error('CALL WITH WRONG MEMORY');
      logger.info('consensus FAIL');
      return 'Failed';
    }
		// create new contract or asset
    logger.debug('simple tx.');
    logger.info('consensus NEXT');
    return 'NEXT';
  } else if (tx.metadata.contractUpdate && tx.operation === 'TRANSFER') {
		/**
     *
     *     TRANSFER TRANSACTION CALL
     *
     */
    let data = tx.metadata.contractUpdate;
    let changedContract = data.address;
    let args = data.args;
    let functionName = data.functionName;
    logger.debug('TRANSFER CONSENSUS CHECK:');
    logger.debug(tx.asset);
    logger.debug(tx.inputs[0]);

    var previousTx = tx.inputs[0].fulfills.transaction_id;

    logger.debug('previousTx:', previousTx);

    let transaction = await projectBlockchain.getTxById(previousTx);

    let inputId = tx.inputs[0].fulfills.output_index;

    logger.debug('inputId:', inputId);

    if (tx.metadata && tx.metadata.lockedOnContract && tx.metadata.outputId === inputId) {
			/*
			* TODO: check is simple - if memory.allowTransfer == true (or assetID)
			* */

      logger.info('LOCKED ON CONTRACT');
			/* TODO [0] */
      let callerPubKey = tx.inputs[0].owners_before[0];
      // let callerPubKey = tx.outputs[0].public_keys[0];

      let transferData = {
        outgoingDestination: tx.outputs[0].public_keys[0],
        id: transaction.txData.id
      };

      logger.debug('transferData:');
      logger.debug(transferData);

      let result = await checkStrategy(changedContract, functionName, args, callerPubKey, false, transferData);

      result = JSON.parse(result);

      if (result.allowTransfer) {
        logger.info('consensus ALLOW');
        return 'ALLOW';
      }
      logger.error('consensus FAIL');
      return 'Failed';
    }
    logger.debug('NEXT: check transfer by public key and other checks');
    logger.info('consensus NEXT');
    return 'NEXT';
  }
}

/** Check the deliverTx
  * @param {Object} tx Transaction to be processed
  * @return {type} JSON returncodes
  */
async function deliverTx(tx) {
  try {
    await worldState.processTx(tx);

    logger.info('ALLOW');
    return 'ALLOW';
  } catch (error) {
    logger.error(error.message);
    logger.info('FAIL');
    return 'Failed';
  }
}

module.exports = services => {
  smartContract = require('./services/services/smartContract')(services);
  projectBlockchain = services.get('bc.abci-project');
  configService = services.get('configService');
  worldState = new WorldStateModule(services, confirmationEvents);

  return {
    configure,
    checkTx,
    deliverTx
  };
};
