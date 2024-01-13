'use strict';

const logger = require('log4js').getLogger('commands.blockchain.services.nodeRedCheckTx');

/** nodeRedCheck
   * @param {object} services Server object
   * @param {string} txId Transaction ID
   * @param {object} response Json output of any function to be validated in nodeRed
   * @return {object} Json Return codes
 */
async function nodeRedCheck(services, txId, response) {
  try {
    const models = services.get('loopbackApp').models;
    const pluginManager = services.get('loopbackApp').plugin_manager;
    const pluginSettings = pluginManager.configs.get('ng-rt-abci-server');
    const isNodeRedHook = pluginSettings.get('nodeRedHook');

    if (isNodeRedHook) {
      const nodeRedRes = await models.uiObserver.notifyObserversOf('checkTxHook', {
        message: response
      });
      const res = nodeRedRes.response;
      logger.debug('return from NodeRed :', res);
      return res;
    }

    // Send the response directly
    return response;
  } catch (err) {
    logger.error('error in node RED : ', err);
    return {
      code: -1,
      log: 'error while validating trasaction in Node red'
    };
  }
}

module.exports = {nodeRedCheck};
