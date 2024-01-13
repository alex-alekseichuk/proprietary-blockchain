/**
 * Datasource interface to access mongodb directly.
 * It has connect method to instantiate datasource instance.
 * Datasource instance should have close method to disconnect from the server.
 */
'use strict';
const logger = require('log4js').getLogger('mongoDb');

module.exports = {
  __components: 'mongoDb',
  connect: async options => {
    const MongoClient = require('mongodb').MongoClient;
    try {
      return await MongoClient.connect(options.url, Object.assign({useNewUrlParser: true}, options.options));
    } catch (err) {
      logger.error(err.message);
      logger.error(`Can't connect to ${options.url}`);
    }
  }
};
