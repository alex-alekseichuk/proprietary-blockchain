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
  let metadata;

  before(() => {
    return manager.getMetadata(TEST_PLUGIN_NAME, null, true).then(res => {
      metadata = res;
      storage = manager.getStorage();
    });
  });

  describe('project/ng-rt-core:#863', () => {
    it('metadata should exist hotfix', () => {
      should.exist(metadata.hotfix);
    });

    it('hotfix version should eqeual test', () => {
      should.equal(metadata.hotfix.version, 'test');
    });

    it('should download from -hotfix bucket', () => {
      should.equal(storage.s3downloaded[1].bucket, `${storage.s3downloaded[0].bucket}-hotfix`);
    });
  });
});
