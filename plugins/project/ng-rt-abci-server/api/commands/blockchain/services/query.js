'use strict';

const logger = require('log4js').getLogger('commands.blockchain.services.query');

module.exports = (services, request) => {
  logger.debug('commands.blockchain.services.query');
  logger.debug('request : ', request);
};
