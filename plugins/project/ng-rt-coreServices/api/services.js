'use strict';

const logger = require('log4js').getLogger('ng-rt-coreServices');

let srv;

module.exports = {
  activate: (server, plugin) => {
    logger.debug('server : ', server);
    logger.debug('plugin : ', plugin);

    srv = server.plugin_manager.services;

    srv.add('storageProviders', require('./services/storageProviders'));
    srv.add('blockchainProviders', require('./services/blockchainProviders'));
    srv.add('aes256', require('./services/aesService'));
    srv.add('authorization', require("./services/authorization")(server));
  },
  deactivate: server => {
    srv = server.plugin_manager.services;
    srv.remove("authorization");
    srv.remove('storageProviders');
    srv.remove('blockchainProviders');
    srv.remove('aes256');
  }
};
