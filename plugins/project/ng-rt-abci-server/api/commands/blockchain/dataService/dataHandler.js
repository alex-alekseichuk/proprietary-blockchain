'use strict';

/* eslint-disable new-cap */

const logger = require('log4js').getLogger('commands.blockchain.dataService.dataHandler');
const {resolveOutputs, resolveInputs} = require('./inpAndOutResolve');
// var Base64 = require('js-base64').Base64;
// const crypto = require('crypto');

/**
 *
 * @param {*} model the request object
 * @param {array} validators the data object to be inserted
 * @return {array} validators data object
 */
async function createValidator(model, validators) {
  logger.debug('model :', model);
  // const floor = Math.floor;
  validators.forEach(validator => {
    // const power = floor(parseFloat(validator.power.low)); // to make sure 'power' is stored as number
    const power = validator.power.low;
    const pubKey = validator.pubKey;
    model.create({power, pubKey});
  });
  return validators;
}

/**
 *
 * @param {*} model the request object
 * @param {array} data the data object to be inserted
 * @return {Object | Error} Models instances
 */
async function create(model, data) {
  return model.create(data);
}

/**
 *
 * @param {*} model the request object
 * @param {array} validators the data object to be inserted
 * @return {array} validators data object
 */
async function updateValidator(model, validators) {
  logger.debug('model :', model);
  // const floor = Math.floor;
  validators.forEach(validator => {
    // const power = parseFloat(validator.power.low); // to make sure 'power' is stored as number
    const power = validator.power;
    const pubKey = validator.pubKey;
    model.upsertWithWhere({"pubKey.data": validator.pubKey.data}, {power, pubKey});
  });
  return validators;
}

/**
 * @param {*} model the request object
 * @param {object} criteria Matching condition for the data
 * @param {*} data object consisting of the data to update
 * @return {*} result Error or Object of updated instance
 */
function update(model, criteria, data) {
  const {power, pubKey} = data;
  return model.updateAll(criteria, {pubKey, power});
}

/**
 * @param {*} model the request object
 * @param {*} id Id of the record to be deleted
 * @return {*} model Record of the model
 */
async function deletebyID(model, id) { // destroy
  return await model.destroyById(id);
}

/**
 * @param {*} model the request object
 * @param {*} id the request object to be matched
 * @return {*} model Record of the model
 */
async function deleteAllData(model) { // destroyall
  return await model.destroyAll();
}

/**
 * @param {*} model the request object
 * @param {*} _filter Criteria to be filtered
 * @return {*} model Record of the model
 */
function deleteByFilter(model, _filter) { // destroyall by filter
  return model.destroyAll(_filter);
}

/**
 * @param {*} model the request object
 * @param {*} _filter Filter to be applied
 * @return {*} model Record of the model
 */
async function findOne(model, _filter = {}) { // findOne and find/findbyId
  return await model.findOne(_filter);
}

/**
 * @param {*} model the request object
 * @param {*} _filter Filter to be applied
 * @return {*} model Record of the model
 */
async function find(model, _filter = {}) {
  return await model.find(_filter);
}

/**
 * @param {Object} data The data object
 * @return {Object} Composed data object
 */
const compose = data => {
  const txTmHash = data.txTmHash;
  const txId = data.tx.id;
  const txTime = data.projectMetadata.timestamp;
  const txData = data.tx;
  const client = txData.metadata;
  const project = data.projectMetadata;
  const txOutput = resolveOutputs(txId, txData.operation, data.tx.outputs);
  const txInput = resolveInputs(txId, txData.operation, data.tx.inputs);

  const tmTx = {
    txTmHash,
    txId,
    txData,
    txMetadata: {project},
    txTime
  };

  const tmAsset = {
    txId,
    type: data.assetDescriptor.assetType,
    hash: data.assetDescriptor.assetHash,
    format: data.assetDescriptor.assetFormat,
    data: data.tx.asset.data ? data.tx.asset.data : data.tx.asset
  };

  const tmMetadata = {
    txTmHash,
    txId,
    client,
    project,
    txTime
  };

  return {
    tmTx, tmAsset, tmMetadata, txInput, txOutput
  };
};

module.exports = {
  create,
  createValidator,
  updateValidator,
  compose,
  update,
  find,
  findOne,
  deleteByFilter,
  deleteAllData,
  deletebyID
};
