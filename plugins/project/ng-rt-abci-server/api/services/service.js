'use strict';

module.exports = {
  activate: (services, pluginInstance) => {
    services.add('abci-server', require('./abci-server')(services, pluginInstance).createAbciServer());
    services.add('abci-client', require('./abci-client')(services));
  },

  deactivate: services => {
    services.remove('abci-client');
    const abciServerService = services.get('abci-server');
    if (abciServerService) {
      abciServerService.close();
    }
    services.remove('abci-server');
  }
};
