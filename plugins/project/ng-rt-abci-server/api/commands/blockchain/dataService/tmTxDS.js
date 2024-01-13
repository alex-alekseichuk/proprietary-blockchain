'use strict';

/* eslint-disable new-cap */

const logger = require('log4js').getLogger('commands.blockchain.services.tmTxDS');
// const crypto = require('crypto');

/**
 *
 * @param {*} model the request object
 * @param {*} txData the name of the model
 * @return {*} model the record of the model
 */
function create(model, txData) {
  logger.trace('execute commands.blockchain.services.tmTxDS');
  logger.debug('model :', model);
  // let txId = tmTx.txId;
  // let txData = tmTx.txData.tx;
  // delete txData.asset;
  // delete txData.metadata;
  // model.create({
  //   txId,
  //   txData
  // });

  model.create(txData);
  return txData;
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
 * @param {*} id transactionId of the record to be found
 * @return {*} model Record of the model or null if the record can't be found
 */
function findOne(model, id) {
  // findOne and find/findbyID
  return new Promise((resolve, reject) => {
    model.findOne({
      where: {txId: id}
    }).then(result => {
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
 * @return {*} model Record of the model or null if the record can't be found
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
 * @param {Object} data The data object
 * @return {Object} Composed data object
 */
const compose = data => {
  const txId = data.tx.id;
  const txData = data.tx;
  const tmTx = {
    txId,
    txData
  };

  const tmAsset = {
    txId,
    type: data.assetType,
    format: data.assetFormat,
    data: data.tx.asset.data ? data.tx.asset.data : data.tx.asset
  };

  const tmMetadata = {
    txId,
    metadata: data.projectMetadata
  };

  return {
    tmTx, tmAsset, tmMetadata
  };
};
// function compose(request) {
//   let data = null;
//   let tmTxDS;
//   let transaction = (request.tx).toString();
//   try {
//     // let txDecoded = JSON.parse(transaction);
//     // logger.debug("txDecoded :", txDecoded);
//     data = JSON.parse(transaction);
//     logger.debug("parsedTxData :", data);
// /*     const algo = "SHA256";
//     // let txHash = utils.getHash(utils.finalizeHash(utils.updateHash(utils.createHash(), transaction)));
//     let txHash = crypto.createHash(algo).update(transaction).digest("Hex");
//     logger.debug('tx Hash :', txHash); */
//     let txHash = data.tx.id;

//     // data = JSON.parse(Base64.decode(txDecoded.data));
//     // let metadata = JSON.parse(Base64.decode(data.metadata));
//     // data.metadata = metadata;
//     // let signedData = JSON.parse(Base64.decode(data.signedData));
//     // data.signedData = signedData;

//     // Need to handle data in better way
//     if (data) {
//       // let datade = JSON.parse(Base64.decode(signedData.data));
//       // data.signedData.data = datade;
//       let datade = data.tx;
//       if (datade.asset.hasOwnProperty('gdpr')) {
//         let GdprData = {
//           txId: txHash,
//           GDPRCompliant: datade.asset.gdpr
//         };
//         delete datade.asset.gdpr;
//         tmTxDS = {
//           txId: txHash,
//           txData: data
//         };
//         tmTxDS.gdprData = GdprData;
//       } else {
//         tmTxDS = {
//           txId: txHash,
//           txData: data
//         };
//       }
//     } else {// if tx sent using bigchain db driver
//       let signedData = data.signedData;
//       if (signedData.asset.hasOwnProperty('data')) {
//         if (signedData.asset.data.hasOwnProperty('gdpr')) {
//           let GdprData = {
//             txId: txHash,
//             GDPRCompliant: signedData.asset.data.gdpr
//           };
//           delete signedData.asset.data.gdpr;
//           tmTxDS = {
//             txId: txHash,
//             txData: data
//           };
//           tmTxDS.gdprData = GdprData;
//         } else {
//           tmTxDS = {
//             txId: txHash,
//             txData: data
//           };
//         }
//       } else {
//         tmTxDS = {
//           txId: txHash,
//           txData: data
//         };
//       }
//     }
//   } catch (error) {
//     // this is unstructured data
//     data = transaction;
//   }
//   logger.trace('tmTxDS.txId :', tmTxDS.txId);
//   return tmTxDS;
// }

module.exports = {
  create,
  compose,
  update,
  findOne,
  findAll,
  deleteAllData,
  deletebyID
};

