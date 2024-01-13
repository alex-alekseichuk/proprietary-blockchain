'use strict';
/* eslint-disable no-unused-vars , no-console*/
var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = chai.expect;
chai.use(chaiHttp);
const logger = require('log4js').getLogger('test.plugins.ng-rt-abci_test');
const mongodb = require('mongodb');

describe('Mongo DB Tests', function() {
  const engine = require('./helper');

  before(async () => {
    let result = false;
    while (result === false) {
      result = await engine.init();
    }
  });
  const serverEnvironment = 'D';
  const clusterId = 'LOCAL';
  const blockchainClusterId = 'BC1';
  const instanceId = 'I01';
  const tenantId = 'T01';
  const envId = 'rt';
  const MongoClient = mongodb.MongoClient;
  let url = `${serverEnvironment}-${blockchainClusterId}-${clusterId}-${instanceId}-${tenantId}-ng-${envId}-bc-public`;
  const mongoTest = new Promise(function(resolve, reject) {
    try {
      var mongoDBhost = 'localhost';
      var mongoDBport = '27017';
      if (mongoDBhost) {
        var connStr = 'mongodb://' + mongoDBhost + ':' + mongoDBport;
        MongoClient.connect(connStr, {useNewUrlParser: true}, function(err, client) {
          if (err) {
            logger.error(err);
            return resolve(null);
          }
          var db = client.db(url);
          return resolve(db);
        });
      }
    } catch (err) {
      console.log('mongo connection error', err);
    }
  });

  it('Mongo DB connection check ', done => {
    mongoTest.then(result => {
      expect(result).to.not.be.undefined;
      done();
    });
  });

  it('Mongo DB init collection check ', done => {
    mongoTest.then(result => {
      var arr = [];
      result.listCollections().toArray(function(err, collInfos) {
        collInfos.forEach(item => {
          arr.push(item.name);
        });
        expect(arr).to.have.members(['tmBlock', 'tmChainInfo', 'tmLatestBlockInformation']);
        done();
      });
    });
  });
});
