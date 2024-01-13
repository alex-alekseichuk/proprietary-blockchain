'use strict';

const logger = require('log4js').getLogger('commands.blockchain.dataService.messaging');

module.exports = {
  send,
  rabbitMQ,
  msgEventEmmitter
};

/**
 *
 * @param {*} services services object
 * @param {*} id Id of the asset or transaction
 * @return {*} JSON object of the response
 */
async function send(services, id) {
  logger.trace('execute messaging');
  logger.debug('Asset to be checked :', id);
  try {
    let pluginManager = services.get('loopbackApp').plugin_manager;
    let pluginSettings = pluginManager.configs.get('ng-rt-abci-server');
    let enableRabbitMQ = pluginSettings.get('rabbitMQ');
    let enableEventEmitter = pluginSettings.get('eventEmitter');

    if (enableRabbitMQ) await rabbitMQ();
    if (enableEventEmitter) await msgEventEmmitter();

    return {
      code: 0,
      log: 'OK '
    };
  } catch (err) {
    logger.debug(err);
    return {
      code: -1,
      log: 'something went wrong'
    };
  }
}

/**
 *
 * @return {*} boolean object of the response
 */
async function rabbitMQ() {
  return true;
}

/**
 *
 * @return {*} boolen object of the response
 */
async function msgEventEmmitter() {
  return true;
}
