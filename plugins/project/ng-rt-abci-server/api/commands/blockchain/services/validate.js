"use strict";
/**
 *
 * This module verifies the transactions composed and posted via DigitalAsset driver
 * Current implementation is specific to Bigchaindb Transactions
 *
 */
const logger = require('log4js').getLogger('commands.blockchain.services.validate');
const _ = require("lodash");
const {sha256Hash: {sha3CreateUpdateHash}, jsonSerialize: serializeData} = require("ng-crypto");
const cc = require('crypto-conditions');
const {findOne} = require("../dataService/dataHandler");

const validateSchema = async tx => {
  return true;
};

const validateTxHash = async tx => {
  try {
    const toSerializeTx = _.cloneDeep(tx);
    const passedTxId = tx.id;
    toSerializeTx.id = null;
    const serializedTx = serializeData(toSerializeTx);
    const calculatedTxId = sha3CreateUpdateHash(serializedTx);
    if (passedTxId === calculatedTxId) {
      return true;
    }

    throw Error("Given TxId and calculated transaction hash do not match!");
  } catch (error) {
    throw error;
  }
};

const checkDupTxIds = async(models, tx, currentTxs = []) => {
  try {
    const {tmTx} = models;
    const _filter = {where: {txId: tx.id}};
    const isFoundDB = await findOne(tmTx, _filter);
    // check tx.id  is present in currentTxs
    // && check if the tx.id is present in the DB
    const isFoundCTxs = currentTxs.find(currentTx => {
      return currentTx.id === tx.id;
    });

    if (isFoundDB || isFoundCTxs) {
      throw Error(`TransactionId: ${tx.id} matches a previous transaction`);
    }
    return true;
  } catch (error) {
    throw error;
  }
};

/* const checkCreateInputs = tx => {
    // check if the tx "inputs" property is valid
  return true;
}; */

/**
 *
 * @param {Object} currentTx  current transaction being validated
 * @param {Object} inputConditions Conditions formed by the output of the selected Tx to be transferred
 * @return {Boolean | Error } Result of validation `true` or Error
 */
const checkTransferInputConditions = async(currentTx, inputConditions) => {
  try {
    // check if the tx "inputs" property is valid
    let txTransfer = _.cloneDeep(currentTx);
    txTransfer.id = null;
    let result = true;
    txTransfer.inputs.forEach(i => {
      i.fulfillment = null;
    });
    inputConditions.forEach((ic, index) => {
      const msg = serializeData(txTransfer);
      const msgUniqueFulfillment = txTransfer.inputs[index].fulfills ? msg
        .concat(txTransfer.inputs[index].fulfills.transaction_id)
        .concat(txTransfer.inputs[index].fulfills.output_index) : msg;
      const msgHash = sha3CreateUpdateHash(msgUniqueFulfillment);
      const inputFulfillment = currentTx.inputs[index].fulfillment;
      const conditions = ic.condition.uri;
      result = result && cc.validateFulfillment(inputFulfillment, conditions, Buffer.from(msgHash, 'hex'));
    });
    return result;
  } catch (error) {
    throw error;
  }
};
const checkDupAssetIds = txs => {
  let assetIdSet = new Set();
  txs.forEach(tx => {
    let id = tx.txData.operation === 'CREATE' ? tx.txId : tx.txData.asset.id;
    assetIdSet.add(id);
  });

  if (assetIdSet.size > 1) {
    const msg = "Asset ids of the inputs doesnt match";
    throw new Error(msg);
  }
  return assetIdSet.values().next();
};

const checkSpentTx = async(models, txId, outputIndex, ownersBefore, currentTxs) => {
  try {
    const {txInput} = models;
    const filter = {where: {'fulfills.transaction_id': txId, 'fulfills.output_index': outputIndex, 'owners_before': ownersBefore}};
    let txExists = await txInput.find(filter);
    /*  const dataList = await find(models.tmTx);
        const txExists = dataList.find(tx => {
          return tx.txData.operation === "TRANSFER" &&
                  tx.txData.inputs[0].fulfills.transaction_id === txId &&
                  tx.txData.inputs[0].fulfills.output_index === outputIndex &&
                  tx.txData.inputs[0].owners_before.includes(ownersBefore);
        }); */
    const txExistsCTxs = currentTxs.find(tx => {
      return tx.txData.operation === "TRANSFER" &&
        tx.txData.inputs.any(i => i.fulfills.transaction_id === txId &&
          i.fulfills.output_index === outputIndex &&
          i.owners_before.includes(ownersBefore));
    });
    if (txExists.length !== 0 || txExistsCTxs) {
      const msg = "Transaction spent already!";
      throw Error(msg);
    }
    return true;
  } catch (error) {
    throw error;
  }
};
const accumulatorFunc = (acc, inputCondition) => {
  return acc + Number(inputCondition.amount);
};

const validateTransferInputs = async(models, tx, currentTxs = []) => {
  try {
    let inputTxs = [];
    let inputConditions = [];

    for (let input of tx.inputs) {
      const {transaction_id: txId, output_index} = input.fulfills;
      await checkSpentTx(models, txId, output_index, input.owners_before[0], currentTxs);

      const _filter = {where: {txId: txId}};
      let inputTx = await findOne(models.tmTx, _filter);

      if (!inputTx) {
        inputTx = currentTxs.find(tx => tx.id == txId);
      }
      if (!inputTx) {
        const msg = `Transaction input for txId: ${txId} doesn't exist`;
        throw new Error(msg);
      }
      // return bool result
      let output = inputTx.txData.outputs[input.fulfills.output_index];
      inputConditions.push(output);
      inputTxs.push(inputTx);
    }

    // Validate that all inputs are distinct
    let links = [];
    let linkSet = new Set();
    tx.inputs.forEach(input => {
      let link = input.fulfills.transaction_id + "//" + input.fulfills.output_index;
      links.push(link);
      linkSet.add(link);
    });

    if (links.length !== linkSet.size) {
      const msg = `Duplicate Txs exist`;
      throw new Error(msg);
    }

    // Validate Asset id
    let assetId = checkDupAssetIds(inputTxs);
    if (assetId.value !== tx.asset.id) {
      const msg = "Asset Ids do not match";
      throw new Error(msg);
    }

    const inputAmt = inputConditions.reduce(accumulatorFunc, 0);

    const outputAmt = tx.outputs.reduce(accumulatorFunc, 0);

    if (outputAmt !== inputAmt) {
      const msg = "Amounts used in inputs must be equal to the amount used in outputs";
      throw new Error(msg);
    }
    await checkTransferInputConditions(tx, inputConditions);
    return true;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 *
 * @param {Object} models Loopback models (tmTx, tmAsset)
 * @param {Object} tx Current Tx
 * @param {Array} currentTxs List of txs in current block
 * @return {Boolean | Error} Returns `true` or throws Error
 */
const validateCreateTx = async(models, tx, currentTxs = []) => {
  try {
    logger.debug('Tx to be checked :', tx);
    // let tmTxList = await models.tmTx.find();

    await checkDupTxIds(models, tx, currentTxs);
    // await checkCreateInputs(tmTxList, tx); // Update to check for correct inputs
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 *
 * @param {*} models Loopback models (tmTx, tmAsset)
 * @param {*} tx Current Tx
 * @param {*} currentTxs List of txs in current block
 * @return {boolean | Error} Returns true or throws error
 */
const validateTransferTx = async(models, tx, currentTxs = []) => {
  try {
    // const tmAssetList = await models.tmAsset.find();
    await checkDupTxIds(models, tx, currentTxs);
    await validateTransferInputs(models, tx, currentTxs);
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 *
 * @param {Object} models Loopback models (tmTx, tmAsset)
 * @param {Object} tx Current Tx
 * @param {Array} currentTxs List of txs in current block
 * @return {boolean | Error} Returns true or throws error
 */
const validateTx = async(models, tx, currentTxs = []) => {
  try {
    await validateSchema(tx);
    await validateTxHash(tx);
    switch (tx.operation) {
      case 'CREATE':
        return await validateCreateTx(models, tx, currentTxs);
      case 'TRANSFER':
        return await validateTransferTx(models, tx, currentTxs);
      default:
        throw Error(`Operation ${tx.operation} is not available`);
    }
  } catch (error) {
    throw error;
  }
};

module.exports = {
  validateTx
};
