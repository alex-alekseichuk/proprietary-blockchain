'use strict';

const logger = require('log4js').getLogger('commands.blockchain.services.initChain');
const deleteDS = require('../dataService/dataSource');
const tmChainInfo = require('../dataService/tmChainInfoDS');
const {createValidator} = require('../dataService/dataHandler');

module.exports = async (services, request) => {
  try {
    logger.debug('commands.blockchain.services.initChain');
    logger.debug('request : ', request);
    let models = services.get('loopbackApp').models;

    await deleteDS.drop(models);
    logger.info('Successfully deleted DS for initChain');
    const result = await tmChainInfo.compose(request);
    await tmChainInfo.create(models.tmChainInfo, result);

    const validators = await createValidator(models.validatorSet, result.validators);
    logger.debug('Validators created', JSON.stringify(validators));
    logger.info('Blockchain information record created ');
  } catch (error) {
    throw new Error(error);
  }
};
