'use strict';

var logger = require('log4js').getLogger('create-assetDefinition');
const {digitalAssetApi} = require('ng-rt-digitalAsset-sdk');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function createAssetDefinition(config) {
    logger.debug('register create digital asset definition');
    RED.nodes.createNode(this, config);

    var assetDefinition = {
      digitalAsset: config.digitalAsset,
      digitalAssetDescription: config.digitalAssetDescription,
      createTransactionAllowedBySystem: config.createTransactionAllowedBySystem,
      transferOwnershipAllowedBySystem: config.transferOwnershipAllowedBySystem,
      createTransactionAllowedByUser: config.createTransactionAllowedByUser,
      transferOwnershipAllowedByUser: config.transferOwnershipAllowedByUser,
      verifySignature: config.verifySignature,
      validateSchema: config.validateSchema,
      divisibleAsset: config.divisibleAsset,
      fungibleAsset: config.falfungibleAssetse,
      blockchainProvider: config.blockchainProvider,
      blockchainProviderVersion: config.blockchainProviderVersion,
      blockchainDriver: config.blockchainDriver,
      blockchainDriverVersion: config.blockchainDriverVersion,
      HTTPBlockchainIPAddress: config.HTTPBlockchainIPAddress,
      HTTPBlockchainPort: config.HTTPBlockchainPort
    };

    this.on('input', async function(msg) {
      // var self = this;
      try {
        logger.debug('msg =', msg);

        const result = await digitalAssetApi.createAssetDefinition(msg.txContext, assetDefinition);
        logger.info(result);
        msg.payload = result;
      } catch (error) {
        msg.payload = {
          statusCode: error.statusCode,
          message: error.message
        };
      }
      this.send(msg);
    });
  }

  RED.nodes.registerType("create-assetDefinition", createAssetDefinition);
};
