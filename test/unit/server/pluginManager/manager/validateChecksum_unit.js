"use strict";

const should = require('chai').should();
const proxyquire = require('proxyquire');
const path = require('path');

const CONFIG = require("../data/testConfig.json");
const PLUGIN_CONFIG = {};
const MODEL_NAMES = ['plugin'];
const TEST_PLUGIN_NAME = 'TEST_PLUGIN_NAME';
const TEST_PLUGIN_FILE_NAME = 'TEST_PLUGIN_NAME.file';
const OTHER_TEST_PLUGIN_FILE_NAME = 'OTHER_TEST_PLUGIN_NAME.file';

const helper = require('../helper')(CONFIG, MODEL_NAMES, PLUGIN_CONFIG);
const FilePluginStorage = require('./FilePluginStorage');
const PluginManager = proxyquire('../../../../../pluginManager/manager', {
  "./FilePluginsStorage": FilePluginStorage
});

describe('PLUGIN_MANAGER check checksum', () => {
  before(() => {
    process.env.BUILD_ID = 'D00000';
    process.env.CORE_VERSION = '2.0';
  });

  let manager = new PluginManager(helper.server, helper.services.get('configService'), helper.services);
  let result;
  let bucket;
  let key = manager.getS3Url(TEST_PLUGIN_FILE_NAME);
  let storage;
  let sourceFilePath = path.resolve(`test/unit/server/pluginManager/data/${TEST_PLUGIN_FILE_NAME}`);
  let otherSourceFilePath = path.resolve(`test/unit/server/pluginManager/data/${OTHER_TEST_PLUGIN_FILE_NAME}`);

  it('validateChecksum function should be exist', () => {
    should.exist(manager.validateChecksum);
  });

  before(async () => {
    storage = await manager.getStorage();
    bucket = manager.getBucketByEnv();
  });

  it('checkChecksum sould be valid', done => {
    manager.validateChecksum(storage, bucket, key, TEST_PLUGIN_NAME, sourceFilePath).then(done);
  });

  it('checkChecksum sould be not valid by wrong file', done => {
    manager.validateChecksum(storage, bucket, key, TEST_PLUGIN_NAME, otherSourceFilePath).then(() => {
      done('checksum is valid');
    }).catch(e => {
      done();
    });
  });

  it('should be removed', () => {
    should.exist(storage.removedPlugins[0], TEST_PLUGIN_NAME);
  });
});