'use strict';

const logger = require('log4js').getLogger('ng-app-documentsSharing/documents/shareDocumentService');

/**
 * @type {service}
 * @param {Object} services - service's scope
 * @param {Object} models - model's scope
 * @param {Object} ctx - payload with file, keys and picked provider
 * @return {Object} promise
 */
module.exports = async (services, models, ctx) => {
  try {
    const blockchain = services.get('digitalAsset');
    const ownerKeyPair = {
      publicKey: ctx.signedTx.outputs[0].public_keys[0],
      privateKey: false
    };
    const assetFormat = {

    };
    logger.info('posting document to blockchain');
    return await blockchain.createAsset(ownerKeyPair, ctx.signedTx, '1', ctx.txData.meta, true, false, ctx.txData.tx.type, assetFormat).then(() => models.uiObserver.notifyObserversOf("DS_post_signed_tx", ctx));
  } catch (error) {
    throw error(error);
  }
};
