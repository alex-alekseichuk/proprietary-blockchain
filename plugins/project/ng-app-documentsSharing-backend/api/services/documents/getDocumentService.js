"use strict";

const logger = require('log4js').getLogger('ng-app-documentsSharing/nsi/getDocumentService');
// const r = require('rethinkdb');

/**
 * @type {service}
 * @param {Object} services - service's scope
 * @param {String} transactionId - the id of transaction
 * @return {promise} json response
 */
module.exports = async (services, transactionId) => {
  const blockchain = services.get('digitalAsset');

  logger.debug("Get TX by ID:", transactionId);

  let tx = await blockchain.getTx(transactionId);
  logger.info("TX:");
  logger.info(tx);
  let data = {
    txPayload: tx.txData
  };
  return data;
};
