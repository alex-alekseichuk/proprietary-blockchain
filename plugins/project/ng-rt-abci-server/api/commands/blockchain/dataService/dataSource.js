'use strict';

const logger = require('log4js').getLogger('commands.initialize.services.deleteDataSource');
const {deleteAllData} = require("./dataHandler");

/**
 * Drop all collections of a given persistence
 * @param {*} configService Instance of a configService
 * @return {*} Promise Promise
 */
// function drop(configService) {
//   const serverEnvironment = configService.get('serverEnvironment');
//   const clusterId = configService.get('clusterId');
//   const blockchainClusterId = configService.get('blockchainClusterId');
//   const instanceId = configService.get('instanceId');
//   const tenantId = configService.get('tenantId');
//   const envId = configService.get('envId');

//   return Promise.all([
//     dropMongoDatabase(`${serverEnvironment}-${blockchainClusterId}-${clusterId}-${instanceId}-${tenantId}-ng-${envId}-bc-public`, configService),
//     dropMongoDatabase(`${serverEnvironment}-${blockchainClusterId}-${clusterId}-${instanceId}-${tenantId}-ng-${envId}-bc-private`, configService)
//   ]);
// }

/**
 * Drop all collections of a given persistence
 * @param {*} models Instance of a configService
 */
async function drop(models) {
  try {
    const {tmMetadata, tmUtxo, tmChainInfo, tmBlock, tmAsset, tmTxGdpr, tmLatestBlockInformation, tmTx, validatorSet} = models;
    const abciModels = [tmMetadata, tmUtxo, tmChainInfo, tmBlock, tmAsset, tmTxGdpr, tmLatestBlockInformation, tmTx, validatorSet];

    abciModels.forEach(model => {
      deleteAllData(model);
    });
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
}

/**
 * Drops all mongo collections
 * @private
 * @param  {string} url url of the MongoDB
 * @param  {string} configService Reference to the config service
 * @return {Promise} - promise
 */
function dropMongoDatabase(url, configService) {
  const mongodb = require('mongodb');
  const MongoClient = mongodb.MongoClient;
  return new Promise(function(resolve, reject) {
    try {
      var mongoDBhost = configService.get('datasources.mongoDB.host');
      var mongoDBport = configService.get('datasources.mongoDB.port');
      if (mongoDBhost) {
        var connStr = 'mongodb://' + mongoDBhost + ':' + mongoDBport;
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

/**
 * Drops all mongo collections
 * @private
 * @param  {string} url url of the MongoDB
 * @param  {string} configService Reference to the config service
 * @return {Promise} - promise
 */
/*eslint-disable*/
function dropDatabase(url, configService) {
  const mongodb = require('mongodb');
  const MongoClient = mongodb.MongoClient;
  return new Promise(function(resolve, reject) {
    try {
      var mongoDBhost = configService.get('datasources.mongoDB.host');
      var mongoDBport = configService.get('datasources.mongoDB.port');
      if (mongoDBhost) {
        var connStr = 'mongodb://' + mongoDBhost + ':' + mongoDBport;
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

module.exports = {
  drop,
  dropMongoDatabase
};
