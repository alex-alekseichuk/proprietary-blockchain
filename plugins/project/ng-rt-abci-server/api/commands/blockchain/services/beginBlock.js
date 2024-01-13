'use strict';

const logger = require('log4js').getLogger('commands.blockchain.services.beginBlock');
const tmBlockDS = require('../dataService/tmBlockDS');
const tmLatestBlockInformationDS = require('../dataService/tmLatestBlockInformationDS');

module.exports = (services, request) => {
  logger.debug('commands.blockchain.services.beginBlock');
  logger.debug(request);
  // let models = services.get('loopbackApp').models;
  const metricsClient = services.get('metricsClient');
  var block = tmBlockDS.compose(request);
  var tmLatestBlock = tmLatestBlockInformationDS.compose(request);
  metricsClient.increment(`BeginBlock`);
  logger.trace('Block :', block);
  logger.trace('tmLatestBlock :', tmLatestBlock);
  return {
    block: block,
    tmLatestBlock: tmLatestBlock
  };
};
