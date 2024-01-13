'use strict';

const logger = require('log4js').getLogger('commands.blockchain.services.deliverTx_hook');
const rp = require('request-promise');

const okResult = {
  code: 0,
  log: 'OK'
};

const failedResult = {
  code: -1,
  log: 'Failed'
};

/** Check scCheck
   * @param {object} services Server object
   * @param {string} tx Transaction
   * @return {object} Json returnCodes
 */
async function scCheck(services, tx) {
  try {
    let configService = services.get("configService");
    let smartContractsHost = configService.get(`smartContractsHost`);
    let smartContractsPort = configService.get(`smartContractsPort`);

    const url = `http://${smartContractsHost}:${smartContractsPort}/ng-rt-smartContracts/consensus/deliverTx/`;
    const options = {
      url: url,
      method: 'POST',
      body: {
        data: tx
      },
      json: true
    };
    logger.info('Smart contract deliverTx is called with ' + url);

    const response = await rp(options);

    logger.info('Result of deliverTx: ' + response);

    switch (response) {
      case 'NEXT':
      case 'ALLOW':
        return okResult;
      case 'FAIL':
      default:
        return failedResult;
    }
  } catch (error) {
    logger.error(error.message);
    return failedResult;
  }
}

module.exports = {
  scCheck
};
