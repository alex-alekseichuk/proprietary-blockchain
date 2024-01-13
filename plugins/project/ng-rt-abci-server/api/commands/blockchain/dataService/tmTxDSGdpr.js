'use strict';

/* eslint-disable new-cap */

const logger = require('log4js').getLogger('commands.blockchain.services.tmTxGdpr');

/**
 *
 * @param {*} model the request object
 * @param {*} tmTxGdpr the name of the model
 * @return {*} model the record of the model
 */
function create(model, tmTxGdpr) {
  logger.trace('execute commands.blockchain.services.tmTxGdpr');
  logger.debug('model :', model);

  model.create({
    tmTxGdpr
  });
  return tmTxGdpr;
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
 * @param {*} id Id of the record to be found
 * @return {*} model Record of the model or null if the record can't be found
 */
function findOne(model, id) { // findOne and find/findbyID
  return new Promise((resolve, reject) => {
    model.findOne({
      where: {'tmTxGdpr.transactionId': id}
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
  deleteAllData,
  deletebyID
};

