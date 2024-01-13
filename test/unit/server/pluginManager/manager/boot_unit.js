"use strict";

var proxyquire = require('proxyquire');

const CONFIG = require("../data/testConfig.immutable.json");
const PLUGIN_CONFIG = {};
const MODEL_NAMES = ['plugin'];
const TEST_PLUGIN_NAME = 'TEST_PLUGIN_NAME';

const helper = require('../helper')(CONFIG, MODEL_NAMES, PLUGIN_CONFIG);
const getPluginManager = require('./manager');
const bootPluginManager = proxyquire('../../../../../server/backend/pluginManager', {
  "../../pluginManager/manager": getPluginManager()
});
let app;
let pluginManager;
let configService = helper.services.get('configService');
let services = helper.services;

describe('PLUGIN MANAGER BOOT', () => {
  before(done => {
    bootPluginManager(helper.server, configService, services);
    app = helper.server;
    pluginManager = app.plugin_manager;
    done();
  });

  it('plugin installed', done => {
    if (pluginManager.installed.length > 0 && pluginManager.installed[0] === TEST_PLUGIN_NAME)
      return done();
    done('Plugin not installed');
  });

  describe('PLUGIN MANAGER BOOT (immutable)', () => {
    before(done => {
      pluginManager.deactivate(TEST_PLUGIN_NAME).then(() => {
        return pluginManager.uninstall(TEST_PLUGIN_NAME);
      }).then(() => {
        const bootPluginManager2 = proxyquire('../../../../../server/backend/pluginManager', {
          "../../pluginManager/manager": getPluginManager(pluginManager.activated, pluginManager.installed, pluginManager.added)
        });
        bootPluginManager2(app, configService, services);
        pluginManager = app.plugin_manager;
        done();
      });
    });

    it('existed plugin installed and acitvated', done => {
      if (pluginManager.installed.length > 0 && pluginManager.installed[0] === TEST_PLUGIN_NAME)
        return done();
      done('Plugin not installed and activated');
    });
  });
});
