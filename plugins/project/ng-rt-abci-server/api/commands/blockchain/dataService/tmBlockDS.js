'use strict';

const logger = require('log4js').getLogger('commands.blockchain.services.tmBlockDS');
const time = require('../utils/time');

/**
 *
 * @param {*} model the name of the model
 * @param {*} blocks Blockinformation
 * @param {*} transactions Array on transactions
 * @return {*} model Record of the model
 */
function create(model, blocks, transactions) {
  // pass array of data to abstract more
  let block = blocks.block;
  let hash = blocks.hash;
  let blockHeight = blocks.block.height.low;
  let blockTime = blocks.block.time.low;
  model.create({
    block,
    hash,
    transactions,
    blockHeight,
    blockTime
  });
  return {
    block,
    hash,
    transactions
  };
}

/**
 *
 * @param {*} model the name of the model
 * @return {*} model Record of the model
 */
function update(model) {
  // model.updateAttribute();
  return {

  };
}

/**
 *
 * @param {*} model the name of the model
 * @param {*} id Id of the record
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
function deleteAllData(model) { // destroy
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
function findOne(model, id) {
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
 * @return {*} model Record of the model
 */
function compose(request) {
  // According to abci types.proto version 3.0.2 NPM
  /*
  var tmBlock = {
    hash: request.hash.toString('hex'),
    block: {
      chainId: request.header.chainId,
      height: {
        low: request.header.height.low,
        high: request.header.height.high,
        unsigned: request.header.height.unsigned
      },
      time: {
        low: request.header.time.low,
        lowUTC: time.convertTimeStampToUTC(request.header.time.low),
        high: request.header.time.high,
        unsigned: request.header.time.unsigned
      },
      totalTxs: {
        low: request.header.totalTxs.low,
        high: request.header.totalTxs.high,
        unsigned: request.header.totalTxs.unsigned
      },
      numTxs: request.header.numTxs,
      lastBlockHash: request.header.lastBlockHash.toString('hex'),
      validatorsHash: request.header.validatorsHash.toString('hex'),
      appHash: request.header.appHash.toString('hex')
    }
  }; */

  // According to abci types.proto version 4.0  NPM
  var tmBlock = {
    hash: request.hash.toString('hex'),
    block: {
      // basic block info
      chainId: request.header.chainId,
      height: {
        low: request.header.height.low,
        high: request.header.height.high,
        unsigned: request.header.height.unsigned
      },
      time: {
        low: request.header.time.seconds.low,
        lowUTC: time.convertTimeStampToUTC(request.header.time.seconds.low),
        high: request.header.time.seconds.high,
        unsigned: request.header.time.seconds.unsigned
      },
      numTxs: request.header.numTxs,
      totalTxs: {
        low: request.header.totalTxs.low,
        high: request.header.totalTxs.high,
        unsigned: request.header.totalTxs.unsigned
      },
      // prev block info
      lastBlockId: {
        hash: request.header.lastBlockId.hash.toString('hex'),
        partsHeader: {
          total: request.header.lastBlockId.partsHeader.total,
          hash: request.header.lastBlockId.partsHeader.hash.toString('hex')
        }
      },
      // hashes of block data
      lastCommitHash: request.header.lastCommitHash.toString('hex'),
      dataHash: request.header.dataHash.toString('hex'),

      // hashes from the app output from the prev block
      validatorsHash: request.header.validatorsHash.toString('hex'),
      nextValidatorsHash: request.header.nextValidatorsHash.toString('hex'),
      consensusHash: request.header.consensusHash.toString('hex'),
      appHash: request.header.appHash.toString('hex'),
      lastResultsHash: request.header.lastResultsHash.toString('hex'),
      // consensus info
      evidenceHash: request.header.evidenceHash.toString('hex'),
      proposerAddress: request.header.proposerAddress.toString('hex')
    }
  };

  return tmBlock;
}

module.exports = {
  create,
  update,
  compose,
  deleteAllData,
  deletebyID,
  findOne
};
// };
