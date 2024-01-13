'use strict';

const logger = require('log4js').getLogger('ng-app-documentsSharing/documents/shareDocumentService');
const querystring = require('querystring');
// const { contextUtil } = require('ng-rt-digitalAsset-sdk');

const StatsD = require('hot-shots');
const statsd = new StatsD({
  host: (process.env.ngrtStatsdHost || '127.0.0.1'),
  port: (process.env.ngrtStatsdPort || '8125'),
  errorHandler: error => logger.error('StatsD exception:', error.message)
});

/**
 * @type {service}
 * @param {Object} services - service's scope
 * @param {Object} models - model's scope
 * @param {Object} data - payload with file, keys and picked provider
 * @param {String} userId - user, who create this tx
 * @param {Object} headers - headers for authorization
 * @return {Object} promise
 */
module.exports = async (services, models, data, userId, headers) => {
  const config = services.get("configService");
  const keyPair = config.get('scKeypair');
  data.keys.forEach(item => {
    item.keyb64 = querystring.escape(new Buffer(item.key).toString('base64'));
  });
  const txContext = {
    digitalAssetType: 'smartContract',
    serverEnvironment: {
      serverUrl: config.get('serverURL'),
      namespace: 'ng-rt-digitalAsset'
    },
    jwtToken: undefined,
    txMethod: 'Async'
  };
  const payload = {
    provider: data.storeType,
    fileName: data.fileName,
    fileId: data.fileId,
    fileSize: data.fileSize,
    blockSize: data.blockSize,
    blocksCount: data.blocksCount,
    enableEncrypt: data.enableEncrypt,
    fileHash: data.fileHash,
    username: data.username,
    project_id: data.project_id,
    SC: (!data.contract || data.contract === "None") ? null : data.contract,
    keys: data.keys,
    scAddr: config.get('smartContractsHost'),
    scPort: config.get('smartContractsPort'),
    clientId: userId,
    additionalMsg: data.additionalMsg,
    txContext: txContext,
    keyPair: keyPair,
    token: headers.authorization
  };

  statsd.increment(`documentSharing, username=${data.username},enableEncrypt=${data.enableEncrypt}, ` +
    `userId=${userId}, projectId=${data.project_id}, fileSize=${data.fileSize}, fileName=${data.fileName}, ` +
    `provider=${data.storeType}`);

  return models.uiObserver.notifyObserversOf("DS_create_document", payload);
};
