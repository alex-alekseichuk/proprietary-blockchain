'use strict';
var logger = require('log4js').getLogger('allow-transfer');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Condig
   */
  function allowTransfer(config) {
    RED.nodes.createNode(this, config);

    this.on('input', function(msg) {
      msg.allowTransfer = {
        amount: msg.transferAmount ? msg.transferAmount : "1",
        assetType: msg.transferAssetType ? msg.transferAssetType : "token",
        destination: msg.transferDestination
      };

      logger.debug("allow transfer for an asset");
      logger.debug(msg.allowTransfer);

      this.send(msg);
    });
  }

  RED.nodes.registerType("allow-transfer", allowTransfer);
};
