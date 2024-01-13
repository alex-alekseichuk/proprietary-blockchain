'use strict';
const path = require('path');

describe.skip('dataRoute backend', function() {
  const engine = require('../engine/helper');
  global.appBase = global.appBase || path.resolve(__dirname, '../../..');

  const config = require('ng-configservice');
  config.read('config/server/config.json');

  var app;
  var request;
  var result = {
    datasourcename: "",
    datadictname: ""
  };

  before(() => {
    return engine.init()
      .then(() => {
        request = require('supertest-as-promised')(engine.server);
        app = engine.app;
      });
  });

  it('Create', done => {
    var testDataSource = {
      name: "ng-rt-dataDictionaryTest",
      connector: "mongodb",
      host: config.get('datasources.mongoDB.host'),
      port: config.get('datasources.mongoDB.port'),
      url: "mongodb://" + config.get('datasources.mongoDB.host') + ":" + config.get('datasources.mongoDB.port') + "/ng_rt",
      database: "ng_rt",
      username: "admin",
      password: "admin",
      debug: false
    };

    var testDataDictionary = {
      properties: {
        itemName: {
          type: "string"
        },
        quantity: {
          type: "number"
        },
        price: {
          type: "number"
        },
        total: {
          type: "number"
        },
        discount: {
          type: "number"
        },
        grandTotal: {
          type: "number"
        }
      },
      readonly: false,
      name: "testDataDictionary",
      base: "commonDataModel",
      strict: false,
      public: true,
      idInjection: true,
      validateUpsert: false,
      validations: [],
      relations: {},
      acls: [],
      methods: {},
      tenant: false,
      options: {
        validateUpsert: true
      }
    };

    app.models.dataSourceRouting.destroyAll({datadictname: testDataDictionary.name}, {datasourcename: testDataSource.name}, function(doc) {
      app.models.dataSource.destroyAll({name: testDataSource.name}, function(doc) {
        app.models.dataDictionary.destroyAll({name: testDataDictionary.name}, function(doc) {
          app.models.dataSource.create(testDataSource).then(function(data) {
            result.datasourcename = data.name;
            app.models.dataDictionary.create(testDataDictionary).then(function(res) {
              result.datadictname = res.name;
              app.models.dataSourceRouting.create(result).then(function(doc) {
                request.get('/api/v2/testDataDictionaries')
                  .expect(200)
                  .then(() => {
                    done();
                  }).catch(err => {
                    done(err);
                  });
              });
            });
          });
        });
      });
    });
  });
});
