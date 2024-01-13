'use strict';

module.exports = {
  activate: services => {
    // Attention: tendermint service must be registered BEFORE digitalAsset service as it is used inside
    delete require.cache[require.resolve('./services/abci-project')];
    delete require.cache[require.resolve('./services/explorer-service')];
    services.add('bc.abci-project', require('./services/abci-project')(services));
    services.add('explorer', require('./services/explorer-service')(services));
  },

  deactivate: services => {
    services.remove('bc.abci-project');
    services.remove('explorer');
  }
};
