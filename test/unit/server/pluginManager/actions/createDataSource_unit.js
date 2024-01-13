'use strict';
const ACTION_NAME = "CREATE_DATASOURCE";

const CONFIG = require("./data/testConfig.json");
const TEST_DATA = require("./data/createDataSourceTestData.json");
const TEST_MONGO_URL = `mongodb://${CONFIG.datasources.mongoDB.host}:${CONFIG.datasources.mongoDB.port}/${CONFIG.serverEnvironment}-${CONFIG.blockchainClusterId}-${CONFIG.clusterId}-${CONFIG.instanceId}-${CONFIG.tenantId}-test`;

const PLUGIN_CONFIG = {};

const MODEL_NAMES = ["dataSource"];

const helper = require('../helper')(CONFIG, MODEL_NAMES, PLUGIN_CONFIG);
var should = require('chai').should();

describe('Plugin Manager Action: CREATE_DATASOURCE', () => {
  let action;

  let actions = {};
  before(() => {
    require('../../../../../pluginManager/actions/createDataSource')(actions, helper.services.get('configService'), helper.services.get('i18n'));
    action = actions[ACTION_NAME];
  });

  it('should be CREATE_DATASOURCE action in actions list', () => {
    should.exist(action);
  });

  describe('create datasource with parameters data', done => {
    let record;
    before(done => {
      action(helper.pluginInstance, { data: TEST_DATA }, helper.server).then(() => {
        record = helper.server.models.dataSource.list[0];
        done();
      }).catch(done);
    });

    it('should exist in dataSource list', () => {
      should.exist(record);
    });

    it('should url eq test url', () => {
      should.equal(record.url, TEST_MONGO_URL);
    });

  });

  describe('create datasource with parameters file', done => {
    let record;
    before(done => {
      action(helper.pluginInstance, { file: './actions/data/createDataSourceTestData.json' }, helper.server).then(() => {
        record = helper.server.models.dataSource.list[0];
        done();
      }).catch(done);
    });

    it('should exist in dataSource list', () => {
      should.exist(record);
    });

    it('should url eq test url', () => {
      should.equal(record.url, TEST_MONGO_URL);
    });
  });
});
