'use strict';

const logger = require('log4js').getLogger('commands.blockchain.services.flush');

module.exports = (services, request) => {
  logger.debug('commands.blockchain.services.flush');
  logger.debug('request : ', request);
};
