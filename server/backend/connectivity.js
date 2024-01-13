'use strict';

var logger = require('log4js').getLogger('connectivity');
var config = require('./configService');

var connectRethinkDB = () => {
  var promise = require('./rethinkdb').connect(config);
  return promise;
};

var connectMongoDB = () => {
  var promise = require('./mongodb').connect(config);
  return promise;
};

var connectRabbitMQ = () => {
  var promise = require('./rabbitMQ').connect(config);
  return promise;
};

// We can't use this method because it depends on blockchain
// and blockchain is provided by the plugin
var checkDigitalAssetInterface = () => {
  return new Promise((resolve, reject) => {
    logger.info('Try post digitalAsset');
    var crypto = require('crypto');
    var buf = {connectivity: crypto.randomBytes(16).readInt16BE()};
    var rethinkdb = require('./rethinkdb');
    // We can't use blockchain in this way anymore
    // var blockchain = require('ng-rt-blockchain');
    var checked = false;
    var listenForTx = () => {
      // start listening for new tx
      return rethinkdb.findCursor({
        filter: (r, query) => {
          return query.changes();
        }
      })
        .then(cursor => {
            // logger.debug('cursor', cursor);
          return new Promise((resolve, reject) => {
            cursor.each(function(err, item) {
                    // logger.debug('cursor', err, item);
              if (err || !item.new_val || item.old_val)
                return;
              var payload = item.new_val.block.transactions[0].transaction.data.payload;
              cursor.close().then(() => {
                resolve(payload);
              });
            });
          });
        });
    };

    listenForTx().then(payload => {
      logger.debug('haspayload:', payload);
      if (payload.connectivity === buf.connectivity) {
        logger.info('Succesfully posted digitalAsset');
        checked = true;
        resolve();
      }
    }).catch(err => {
      reject(err);
    });

    // var bigchainDbHost = config.get("bigchainDbHost");
    // var bigchainDbPort = config.get("bigchainDbPort");
    // blockchain.postCreateTx('4gjk9SJN3mHBequvPJFR4PggssYrXgsBRpKjcMbVD2N4', buf, bigchainDbHost, bigchainDbPort)
    //         .then(() => { // logger.debug('tx posted');
    //         });
    setTimeout(() => {
      if (!checked)
        reject('Test digitalAsset rejected by timeout');
    }, 5000);
  });
};

module.exports = {
  connectRethinkDB: connectRethinkDB,
  connectMongoDB: connectMongoDB,
  connectRabbitMQ: connectRabbitMQ,
  checkDigitalAssetInterface: checkDigitalAssetInterface
};
