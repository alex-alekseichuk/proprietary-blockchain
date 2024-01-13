"use strict";

const logger = require('log4js').getLogger('ng-app-documentsSharing/nsi/getFederationNodes');
const request = require('request');

/**
 * @type {service}
 * @param {Object} services - service's scope
 * @param {String} contractId - the id of contract
 * @param {Object} headers - headers for authorization
 * @param {Function} __callback - Callback
 */
module.exports = (services, contractId, headers, __callback) => {
  const configService = services.get('configService');
  logger.debug("contractId:", contractId);
  const keyPair = configService.get('scKeypair');

  let url = `${configService.get('https') ? 'https' : 'http'}://` +
    `${configService.get('smartContractsHost') || '127.0.0.1'}:` +
    `${configService.get('smartContractsPort') || '8080'}` +
    `/ng-rt-smartContracts/contracts/call/${contractId}/get-federation-nodes`;

  logger.debug("URL:", url);

  request.post({
    url: url,
    method: 'POST',
    headers: {
      Authorization: headers.authorization
    },
    form: {
      privKey: keyPair.private,
      pubKey: keyPair.public
    }
  }, (error, response, body) => {
    if (error) {
      return __callback({error: error});
    }

    try {
      logger.debug('body', body);
      const result = JSON.parse(body);
      logger.debug('result', result);

      __callback({federationNodes: result});
    } catch (e) {
      logger.error("smart contracts response error:");
      logger.error(e);
      __callback({error: e});
    }
  });
};
