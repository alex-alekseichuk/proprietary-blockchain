'use strict';

const logger = require('log4js').getLogger('ng-admin-settings-backend.service');

const activate = (services, pluginInstance) => {
  delete require.cache[require.resolve('./services/ng-admin-settings-backendImpl1')];
  delete require.cache[require.resolve('./services/ng-admin-settings-backendImpl2')];

  logger.debug('plugin : ', pluginInstance.name);

  services.add('ng-admin-settings-backendService1', require('./services/ng-admin-settings-backendImpl1'));
  services.add('ng-admin-settings-backendService2', require('./services/ng-admin-settings-backendImpl2'));
};

const deactivate = () => {
  'ng-admin-settings-backendService';
};

module.exports = {
  activate,
  deactivate
};
