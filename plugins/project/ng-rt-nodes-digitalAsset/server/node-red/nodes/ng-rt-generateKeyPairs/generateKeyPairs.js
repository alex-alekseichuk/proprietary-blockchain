'use strict';

var logger = require('log4js').getLogger('generateKeyPairs');
const {digitalAssetDriver} = require('ng-rt-digitalAsset-sdk');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function generateKeyPairs(config) {
    logger.debug('register create digital asset module');
    RED.nodes.createNode(this, config);
    var field = config.field;

    this.on('input', async function(msg) {
      try {
        logger.debug(field);

        const keyPair = await digitalAssetDriver.generateKeyPairs();
        msg[field] = keyPair.signKp;
        logger.debug("Field value:", msg[field]);
        msg.payload = keyPair.signKp;
      } catch (error) {
        logger.error(error.message);
        msg.payload = {
          statusCode: error.statusCode,
          message: error.message
        };
      }
      this.send(msg);
    });
  }

  RED.nodes.registerType("generateKeyPairs", generateKeyPairs);
};
