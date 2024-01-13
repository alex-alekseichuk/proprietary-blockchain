'use strict';

var logger = require('log4js').getLogger('txContext');
const {contextUtil} = require('ng-rt-digitalAsset-sdk');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function txContext(config) {
    logger.debug('register txContext');
    RED.nodes.createNode(this, config);
    // var field = config.field;
    var assetType = config.assetType;

    this.on('input', async function(msg) {
      try {
        const field = "txContext";
        let services = global.serviceManager;
        let configService = services.get("configService");

        logger.debug(field);
        const txContext = await contextUtil.createServerTxContext(assetType);
        txContext.serverEnvironment = {};
        txContext.serverEnvironment.namespace = "ng-rt-digitalAsset";
        txContext.serverEnvironment.serverUrl = configService.get('publicDNSName');

        msg[field] = txContext;

        logger.debug("Field value:", msg[field]);
        msg.payload = txContext;
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

  RED.nodes.registerType("txContext", txContext);
};
