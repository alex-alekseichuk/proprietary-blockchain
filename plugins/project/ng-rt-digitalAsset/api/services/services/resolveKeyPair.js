'use strict';

const logger = require('log4js').getLogger('ng-rt-digitalAsset.service.resolveKeyPair');
const daDriver = require('ng-rt-digitalAsset-sdk').digitalAssetDriver;
let models = {};

/**
 * Get public key by user ID
 * @private
 * @param {String} userId User ID
 * @return {string} the public key of user
 */
const getPublicKeyByUserId = async userId => {
  try {
    const keys = await models.publicKey.findOne({where: {userId: userId}});
    if (keys && keys.key) {
      logger.debug('Public key from publicKey collection', keys.key);
      return keys.key;
    }
    const keypair = await models.keypair.findOne({where: {userId: userId}});
    if (keypair && keypair.pubkey) {
      logger.debug('Public key from keypair collection', keypair.pubkey);
      return keypair.pubkey;
    }
  } catch (err) {
    logger.error('Error while trying to get a publicKey for user with id ' + userId, err);
    throw err;
  }
};

/**
 * Get public key by user ID
 * @private
 * @param {String} externalUserId externalId of the user
 * @return {string} the public key of user
 */
const getPublicKeyByExternalUserId = async externalUserId => {
  try {
    const user = await models.user.findOne({where: {externalId: externalUserId}});
    if (user) {
      const keys = await models.publicKey.findOne({where: {userId: user.id}});
      if (keys && keys.key) {
        logger.debug('Public key from publicKey collection', keys.key);
        return keys.key;
      }
      const keypair = await models.keypair.findOne({where: {userId: user.id}});
      if (keypair && keypair.pubkey) {
        logger.debug('Public key from keypair collection', keypair.pubkey);
        return keypair.pubkey;
      }
    }
  } catch (err) {
    logger.error('Error while trying to get a publicKey for user with id ' + externalUserId, err);
    throw err;
  }
};

/**
 * API/Service/ng-rt-digitalAsset/resolveKeyPair
 *
 * @module API/Service/ng-rt-digitalAsset/resolveKeyPair
 * @param {Object} services -  TBSP services object
 */

module.exports = services => {
  const configService = services.get('configService');
  models = services.get("loopbackApp").models;

  /**
   * Resolves a keypair based on the given keySource ()
   * @param {string} publicKeyOrId a public or a id of a user
   * @param {string} keySource source for key retrieval
   * @return {object} Keypair resolved from the keysource
   */
  const resolveKeyPair = (publicKeyOrId, keySource) => {
    switch (keySource) {
      default:
      case 'externalPublicKey': {
        return {
          publicKey: publicKeyOrId,
          privateKey: undefined
        };
      }
      case 'externalUserId': {
        return {
          publicKey: getPublicKeyByExternalUserId(publicKeyOrId),
          privateKey: undefined
        };
      }
      case 'userId': {
        return {
          publicKey: getPublicKeyByUserId(publicKeyOrId),
          privateKey: undefined
        };
      }
      case 'system': {
        let keypair = configService.get('keypair');
        return daDriver.extractKeys(keypair.private);
      }
      case 'generate': {
        let keys = daDriver.generateKeyPairs();
        return keys.signKp;
      }
      case 'smartContract': {
        return {
          publicKey: configService.get('scKeypair').public,
          privateKey: configService.get('scKeypair').private
        };
      }
    }
  };

  return {
    resolveKeyPair
  };
};
