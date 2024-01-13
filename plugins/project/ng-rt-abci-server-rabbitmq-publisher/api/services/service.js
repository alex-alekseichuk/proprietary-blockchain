'use strict';

const logger = require('log4js').getLogger('ng-rt-abci-server-rabbitmq-publisher.service');

const activate = (services, pluginInstance) => {
  delete require.cache[require.resolve('./services/ng-rt-abci-server-rabbitmq-publisher')];
  logger.debug('plugin : ', pluginInstance.name);
  services.add('ng-rt-abci-server-rabbitmq-publisherService', require('./services/ng-rt-abci-server-rabbitmq-publisher')(services));
};

const deactivate = () => {
  'ng-rt-abci-server-rabbitmq-publisherService';
};

module.exports = {
  activate,
  deactivate
};
