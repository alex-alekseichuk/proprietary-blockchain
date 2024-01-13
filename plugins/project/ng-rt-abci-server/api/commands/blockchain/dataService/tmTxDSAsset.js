'use strict';

/* eslint-disable new-cap */

const logger = require('log4js').getLogger('commands.blockchain.services.tmTxAsset');

/**
 *
 * @param {*} model the request object
 * @param {*} tmTxAsset the name of the model
 * @return {*} model the record of the model
 */
function create(model, tmTxAsset) {
  logger.trace('execute commands.blockchain.services.tmTxAsset');
  logger.debug('model :', model);
  let txId = tmTxAsset.txId;
  let data = tmTxAsset.txData.tx.asset;
  let type = tmTxAsset.txData.assetType;
  let format = tmTxAsset.txData.assetFormat;
  model.create({
    txId,
    type,
    format,
    data
  });
  return {
    txId,
    type,
    format,
    data
  };
}

/**
 * @param {*} model the request object
 */
function update(model) {
  // model.updateAttribute();
  return;
}

/**
 * @param {*} model the request object
 * @param {*} id Id of the record to be deleted
 * @return {*} model Record of the model
 */
function deletebyID(model, id) { // destroy
  return model.destroyById(id);
}

/**
 * @param {*} model the request object
 * @return {*} model Record of the model
 */
function deleteAllData(model) { // destroyall
  return model.destroyAll({
    where: {}
  });
}
/**
 * @param {*} model the request object
 * @return {*} model Record of the model
 */
function findAll(model) {
  // findOne and find/findbyID
  return new Promise((resolve, reject) => {
    model.find().then(result => {
      logger.info('result: ', result);
      if (result !== null) {
        logger.info('id found');
        return resolve(result);
      }
      logger.info('id not found');
      return resolve(null);
    }).catch(function(err) {
      logger.error('Error :', err);
      return reject(err);
    });
  });
}

/**
 * @param {*} model the request object
 * @param {*} id Id of the record to be found
 * @return {*} model Record of the model or null if the record can't be found
 */
function findOne(model, id) { // findOne and find/findbyID
  return new Promise((resolve, reject) => {
    model.findOne({
      where: {txId: id}
    })
      .then(result => {
        logger.info('result: ', result);
        if (result !== null) {
          logger.info('id found');
          return resolve(result);
        }
        logger.info('id not found');
        return resolve(null);
      })
      .catch(function(err) {
        logger.error('Error :', err);
        return reject(err);
      });
  });
}

/**
 * @param {*} request the request object
 */
function compose(request) {
  return;
}

module.exports = {
  create,
  compose,
  update,
  findOne,
  findAll,
  deleteAllData,
  deletebyID
};

