'use strict';

const logger = require('log4js').getLogger('commands.initialize.services.deleteDataSource');

module.exports = configService => {
  logger.debug('commands.initialize.services.deleteDataSource');
  logger.trace('Delete enviroment %s specific dataSources', configService.get('envId'));

  const serverEnvironment = configService.get('serverEnvironment');
  const clusterId = configService.get('clusterId');
  const blockchainClusterId = configService.get('blockchainClusterId');
  const instanceId = configService.get('instanceId');
  const tenantId = configService.get('tenantId');
  const envId = configService.get('envId');

  return Promise.all([
    dropMongoDatabase(`${serverEnvironment}-${blockchainClusterId}-${clusterId}-${instanceId}-${tenantId}-ng-${envId}-node-red`, configService),
    dropMongoDatabase(`${serverEnvironment}-${blockchainClusterId}-${clusterId}-${instanceId}-${tenantId}-ng-${envId}-auth`, configService),
    dropMongoDatabase(`${serverEnvironment}-${blockchainClusterId}-${clusterId}-${instanceId}-${tenantId}-ng-${envId}-app`, configService),
    dropMongoDatabase(`${serverEnvironment}-${blockchainClusterId}-${clusterId}-${instanceId}-${tenantId}-ng-${envId}-logs`, configService),
    dropMongoDatabase(`${serverEnvironment}-${blockchainClusterId}-${clusterId}-${instanceId}-${tenantId}-ng-${envId}-smart_contracts`, configService),
    dropMongoDatabase(`${serverEnvironment}-${blockchainClusterId}-${clusterId}-${instanceId}-${tenantId}-ng-${envId}`, configService)
  ]);

  /**
   * Drops all mongo collections
   * @param  {string} url url of the MongoDB
   * @param  {string} configService Reference to the config service
   * @return {Promise} - promise
   */
  function dropMongoDatabase(url, configService) {
    const mongodb = require('mongodb');
    const MongoClient = mongodb.MongoClient;
    return new Promise(function(resolve, reject) {
      try {
        var mongoDBhost = configService.get('datasources.default.host');
        var mongoDBport = configService.get('datasources.default.port');
        if (mongoDBhost) {
          var connStr = 'mongodb://' + mongoDBhost + ':' + mongoDBport;
          logger.debug(connStr);
          MongoClient.connect(connStr, function(err, client) {
            if (err) {
              logger.error(err);
              return resolve(null);
            }
            var db = client.db(url);
            db.dropDatabase(function(err, deleted) {
              if (err) {
                logger.error(err);
              }
              logger.debug('Done. DB %s deleted.', url);
              client.close();
              return resolve(null);
            });
          });
        } else {
          return resolve(null);
        }
      } catch (e) {
        logger.error(e);
        return resolve(null);
      }
    });
  }
};
