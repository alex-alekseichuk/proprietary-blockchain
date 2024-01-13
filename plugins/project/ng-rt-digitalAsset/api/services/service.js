'use strict';

module.exports = {
  activate: services => {
    delete require.cache[require.resolve('./services/resolveKeyPair')];
    delete require.cache[require.resolve('./services/digital-asset')];
    delete require.cache[require.resolve('./services/block-explorer')];

    services.add('resolveKeyPair', require('./services/resolveKeyPair')(services));
    services.add('digitalAsset', require('./services/digital-asset')(services));
    services.add('blockExplorer', require('./services/block-explorer')(services));
  },

  deactivate: services => {
    services.remove('resolveKeyPair');
    services.remove('digitalAsset');
    services.remove('blockExplorer');
  }
};
