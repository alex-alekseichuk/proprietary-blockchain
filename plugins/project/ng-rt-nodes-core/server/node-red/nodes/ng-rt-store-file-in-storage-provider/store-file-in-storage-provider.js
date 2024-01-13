/**
 * Created by alibe on 18.08.2016.
 */
'use strict';

const logger = require('log4js').getLogger('store-file-in-storage-provider');

module.exports = function(RED) {
  /**
   * Store provider node
   * @param {Object} config - configuration of node
   */
  function storageProvider(config) {
    logger.debug('register store file in storage-provider module');
    RED.nodes.createNode(this, config);
    this.on('input', function(msg) {
      let self = this;
      let storageProvidersService = global.serviceManager.get('storageProviders');
      storageProvidersService.get(msg.ctx.provider).storeFile(msg.ctx.file).then(fileId => {
        msg.fileId = fileId;
        self.send(msg);
      });
    });
  }
  RED.nodes.registerType("store-file-in-storage-provider", storageProvider);
};
