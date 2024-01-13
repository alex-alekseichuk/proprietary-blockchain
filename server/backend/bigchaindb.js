/**
 * Interface to bigchaindb
 */
'use strict';
const logger = require('log4js').getLogger('bigchaindb');
const request = require('request-promise');

const connect = config => {
  const host = config.get('bigchainDbHost');
  const port = config.get('bigchainDbPort');
  const url = `http://${host}:${port}`;
  const msg = {
    connecting: 'Trying to connect to BigchainDB :',
    success: 'Successfully connected to BigchainDB',
    error: 'No connection to BigchainDB'
  };

  logger.trace(msg.connecting);

  return request({
    uri: url,
    json: true
  })
    .then(response => {
      if (response && response.software === "BigchainDB") {
        logger.info(msg.success);
        return Promise.resolve();
      }
      return Promise.reject(msg.error);
    })
    .catch(err => {
      logger.error(err.message);
      return Promise.reject(msg.error);
    });
};

module.exports = {
  connect
};
