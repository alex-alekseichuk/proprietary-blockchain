'use strict';

var logger = require('log4js').getLogger('get-digitalAsset');
const {digitalAssetApi} = require('ng-rt-digitalAsset-sdk');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function getDigitalAsset(config) {
    logger.debug('register create digital asset module');
    RED.nodes.createNode(this, config);

    this.on('input', async function(msg) {
      try {
        const getAsset = await digitalAssetApi.getAsset(msg.payload.txContext, msg.payload.txId);

        msg.payload = getAsset;
      } catch (error) {
        msg.payload = {
          statusCode: error.statusCode,
          message: error.message
        };
      }
      this.send(msg);
    });
  }

  RED.nodes.registerType("get-digitalAsset", getDigitalAsset);
};
