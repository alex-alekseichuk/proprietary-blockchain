"use strict";

var proxyquire = require('proxyquire');

const CONFIG = require("../data/testConfig.immutable.json");
const PLUGIN_CONFIG = {};
const MODEL_NAMES = ['plugin'];
const TEST_PLUGIN_NAME = 'TEST_PLUGIN_NAME';

const helper = require('../helper')(CONFIG, MODEL_NAMES, PLUGIN_CONFIG);
const FilePluginStorage = require('./FilePluginStorage');
const PluginManager = proxyquire('../../../../../pluginManager/manager', {
  "./FilePluginsStorage": FilePluginStorage
});
const ACTION_TYPE = 'NPM_INSTALL';

describe('PLUGIN MANAGER (immutable reject)', () => {
  before(() => {
    process.env.BUILD_ID = 'D00000';
    process.env.CORE_VERSION = '2.0';
  });

  let manager = new PluginManager(helper.server, helper.services.get('configService'), helper.services);

  // before(() => {
  //   return manager.getMetadata(TEST_PLUGIN_NAME, null, true).then(res => {
  //     storage = manager.getStorage();
  //   });
  // });

  it('project/ng-rt-core:#160 immutable action reject', done => {
    manager.events.on(`status ${ACTION_TYPE} --> 0`, () => {
      done('action not rejected');
    });
    manager.runAction(TEST_PLUGIN_NAME, [{type: ACTION_TYPE}], 0).then(() => {
      setTimeout(() => {
        done();
      }, 100);
    });
  });
});
