"use strict";

var should = require('chai').should();
var proxyquire = require('proxyquire');

const CONFIG = require("../data/testConfig.json");
const PLUGIN_CONFIG = {};
const MODEL_NAMES = ['plugin'];
const TEST_PLUGIN_NAME = 'TEST_PLUGIN_NAME';

const helper = require('../helper')(CONFIG, MODEL_NAMES, PLUGIN_CONFIG);
const FilePluginStorage = require('./FilePluginStorage');
const PluginManager = proxyquire('../../../../../pluginManager/manager', {
  "./FilePluginsStorage": FilePluginStorage
});

describe('PLUGIN MANAGER (get metadata)', () => {
  before(() => {
    process.env.BUILD_ID = 'D00000';
    process.env.CORE_VERSION = '2.0';
  });

  let manager = new PluginManager(helper.server, helper.services.get('configService'), helper.services);
  let storage;

  before(() => {
    return manager.getMetadata(TEST_PLUGIN_NAME, null, true).then(res => {
      storage = manager.getStorage();
    });
  });

  it('project/ng-rt-core:#63 metadata json file place', () => {
    should.equal(storage.s3downloaded[0].key, storage.s3downloaded[0].key, `${process.env.CORE_VERSION}/latest/${TEST_PLUGIN_NAME}.json`);
  });
});
