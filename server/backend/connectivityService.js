/* eslint-disable complexity */
'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('service.check-connectivity');

/**
 * @param {object}  services - The object instance of the type services
 * @param {object}  configService - The object instance of the type config services
 * @param {object}  argv - The object instance of the type ARGV
 * @param {object}  i18n - The object instance of type i18n
 * return {object}        just process.exit()
 */
async function check(services, configService, argv, i18n) {
  const {
    skipAllConnectivityTests, skipConnectivityTestRethinkDB, skipConnectivityTestRabbitMQ, skipConnectivityTestMongoDB,
    skipConnectivityTestBigchainDB
  } = argv;

  logger.trace(i18n.__('executing :'));
  if (skipAllConnectivityTests) {
    logger.debug(i18n.__('Skipping all kinds of connectivity tests'));
    return;
  }
  logger.info(i18n.__('Connectivity test running'));

  if (skipConnectivityTestRethinkDB) logger.info(i18n.__('Skipping RethinkDB connectivity test'));
  if (skipConnectivityTestMongoDB) logger.info(i18n.__('Skipping MongoDB connectivity test'));
  if (skipConnectivityTestBigchainDB) logger.info(i18n.__('Skipping BigchainDB connectivity test'));
  if (skipConnectivityTestRabbitMQ) logger.info(i18n.__('Skipping RabbitMQ connectivity test'));

  if (configService.get('databaseType') === 'rethinkdb' && !skipConnectivityTestRethinkDB)
    await require('./rethinkdb').connect(configService);
  if (!skipConnectivityTestBigchainDB)
    await require('./bigchaindb').connect(configService);
  if (!skipConnectivityTestRabbitMQ)
    await require('./rabbitMQ').connect(configService);

  // check mongoDB datasources
  if (configService.get('databaseType') === 'mongodb' && !skipConnectivityTestMongoDB) {
    const dataSources = configService.get('datasources');
    if (dataSources) {
      await Object.keys(dataSources).forEach(async name => {
        const dsRecord = dataSources[name];
        if (!dsRecord.factory)
          return;
        if (!services.get(name))
          throw new Error(`Can't connect to ${name} datasource`);
      });
    }
  }

  logger.info(i18n.__('Connectivity test succeeded'));
}

module.exports = {
  check
};
