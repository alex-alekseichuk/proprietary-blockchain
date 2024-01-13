'use strict';

const logger = require('log4js').getLogger('commands.blockchain.services.tmLatestBlockInformationDS');

/**
 *
 * @param {*} model the name of the model
 * @param {*} blocks the record of the model
 * @return {*} model the record of the model
 */
function create(model, blocks) {
  logger.trace('execute commands.blockchain.services.tmLatestBlockInformationDS');
  let block = blocks.block;
  let hash = blocks.hash;
  model.create({
    block,
    hash
  });
  return {
    block,
    hash
  };
}

/**
 *
 * @param {*} model the name of the model
 */
function update(model) {
  // model.updateAttribute();
  return;
}

/**
 *
 * @param {*} model the name of the model
 * @param {*} id Id of the record to be deleted
 * @return {*} model Record of the model
 */
function deletebyID(model, id) { // destroy
  return model.destroyById(id);
}

/**
 *
 * @param {*} model the name of the model
 * @return {*} model Record of the model
 */
function deleteAllData(model) { // destroyall
  return model.destroyAll({
    where: {}
  });
}

/**
 *
 * @param {*} model the name of the model
 * @param {*} id hash of the record
 * @return {*} model Record of the model
 */
function findOne(model, id) { // findOne and find/findbyID
  return new Promise((resolve, reject) => {
    model.findOne({
      where: {hash: id}
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
 * @return {*} tmLatestBlockInformation Record
 */
function compose(request) {
  var tmLatestBlockInformation = {
    hash: request.hash.toString('hex'),
    block: {
      chainId: request.header.chainId,
      height: request.header.height.low,
      appHash: request.header.appHash.toString('hex')
    }
  };
  return tmLatestBlockInformation;
}

/**
 *
 * @param {*} model the name of the model
 * @param {*} blocks the record of the model
 */
async function writeLatestBlockInfo(model, blocks) {
  logger.trace('execute commands.blockchain.services.tmLatestBlockInformationDSWrite');
  await deleteAllData(model);
  await create(model, blocks);
  return; // decide return
}

/**
 *
 * @param {*} model the name of the model
 * @return {*} model Record of the model
 */
function findLatestBlock(model) {
  return model.findOne({
    limit: 1
  });
}

module.exports = {
  create,
  compose,
  findOne,
  deletebyID,
  update,
  writeLatestBlockInfo,
  findLatestBlock
};
