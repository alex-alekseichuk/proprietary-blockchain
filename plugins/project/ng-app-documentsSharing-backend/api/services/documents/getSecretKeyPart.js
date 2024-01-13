"use strict";
const logger = require('log4js').getLogger('ng-app-documentsSharing/nsi/getSecretKeyPart');
const request = require('request');

/**
 * @type {service}
 * @param {Object} services - service's scope
 * @param {String} contractId - the id of contract
 * @param {String} pubKey - public key of user
 * @param {String} federationNodeAddress - address of federation node to get key part from
 * @param {Object} headers - headers for authorization
 * @param {Function} __callback - Callback
 */
module.exports = (services, contractId, pubKey, federationNodeAddress, headers, __callback) => {
  logger.debug("contractId:", contractId);

  const configService = services.get('configService');
  const keyPair = configService.get('scKeypair');

  let url = `${configService.get('https') ? 'https' : 'http'}://` +
    federationNodeAddress + "/ng-rt-smartContracts/contracts/call/" + contractId +
    "/get_access";

  logger.debug("URL:", url);

  request.post({
    url: url,
    method: 'POST',
    headers: {
      Authorization: headers.authorization
    },
    form: {
      args: JSON.stringify([keyPair.public, false]),
      privKey: keyPair.private,
      pubKey: keyPair.public
    }
  }, (error, response, body) => {
    if (error) {
      return __callback({error: error});
    }

    try {
      body = JSON.parse(body);

      let result;

      if (body.result && body.result.result) {
        result = body.result.result.string;
      } else {
        result = body.string;
      }

      __callback({keyPart: result});
    } catch (e) {
      logger.error("smart contracts response error:");
      logger.error(e);
      __callback({error: e});
    }
  });
};
