'use strict';
/*
 * Created by alibe on 18.08.2016.
 */

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function createAssetSignedByClient(config) {
    RED.nodes.createNode(this, config);

    this.on('input', function(msg) {
      var self = this;

      if (typeof msg.ctx.digitalAsset !== 'string')
        msg.ctx.digitalAsset = JSON.stringify(msg.ctx.digitalAsset);

      global.serviceManager.get('digitalAsset').createAssetSignedByClient(
        msg.ctx.digitalAssetType, msg.ctx.digitalAsset, msg.ctx.clientId
      ).then(txData => {
        msg.ctx.txData = txData;
        self.send(msg);
      });
    });
  }

  RED.nodes.registerType("create-digitalAsset-signed-by-client", createAssetSignedByClient);
};
