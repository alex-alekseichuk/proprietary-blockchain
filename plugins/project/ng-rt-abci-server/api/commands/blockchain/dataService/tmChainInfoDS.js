'use strict';

const logger = require('log4js').getLogger('commands.blockchain.services.tmChainInfo');
const time = require('../utils/time');

/**
 *
 * @param {*} model the request object
 * @param {*} blocks the name of the model
 * @return {*} model the record of the model
 */
function create(model, blocks) {
  logger.trace('execute commands.blockchain.services.tmChainInfo');
  logger.debug('model :', model);
  let lowUTC = blocks.lowUTC;
  let chainId = blocks.chainId;
  model.create({
    lowUTC,
    chainId
  });
  return {
    lowUTC,
    chainId
  };
}

/**
 *
 * @param {*} model the request object
 */
function update(model) {
  // model.updateAttribute();
  return;
}

/**
 *
 * @param {*} model name of the model
 * @param {*} id Id of the record
 * @return {*} model the record of the model
 */
function deletebyID(model, id) { // destroy
  return model.destroyById(id);
}

/**
 *
 * @param {*} model the request object
 * @return {*} model the record of the model
 */
function deleteAllData(model) { // destroyall
  return model.destroyAll({
    where: {}
  });
}
/**
 *
 * @param {*} model name of the model
 * @param {*} id Id of the record
 * @return {*} model the record of the model
 */
function findOne(model, id) { // findOne and find/findbyID
  return new Promise((resolve, reject) => {
    model.findOne({
      where: {chainId: id}
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
      return reject();
    });
  });
}

/**
 *
 * @param {*} request Instance of the request object
 * @return {*} model the record of the model
 */
function compose(request) {
  var tmChainInfoDS = {
    lowUTC: time.convertTimeStampToUTC(request.time.seconds.low),
    chainId: request.chainId,
    consensusParams: request.consensusParams,
    validators: request.validators
  };
  return tmChainInfoDS;
}

module.exports = {
  create,
  compose,
  update,
  findOne,
  deletebyID,
  deleteAllData
};
