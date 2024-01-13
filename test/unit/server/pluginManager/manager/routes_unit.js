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
const getServices = require('../services');
const routes = proxyquire('../.././../../../server/routes/plugins', {
  "../services": getServices({ config: CONFIG })
});
let app;
let pluginManager;
let configService = helper.services.get('configService');
let services = helper.services;

describe('PLUGIN MANAGER ROUTER', () => {
  let namespace = configService.get('namespace');
  before(done => {
    bootPluginManager(helper.server, configService, services);
    app = helper.server;
    pluginManager = app.plugin_manager;
    routes(app);
    done();
  });

  it('has get route plugins', done => {
    if (app.testRouter.hasGetRoute(`/${namespace}/plugins`))
      return done();
    done('no route /plugins');
  });

  describe('PLUGIN MANAGER ROUTER (IMMUTABLE CONTAINER)', () => {
    it('install route rejected', done => {
      app.testRouter.runPost(`/${namespace}/plugins/install`, {pluginName: TEST_PLUGIN_NAME}).then(response => {
        done('install not rejected');
      }).catch(status => {
        if (status.status === 500 && status.message.message === 'Action by UI denied')
          return done();
        done(status);
      });
    });

    it('activate route rejected', done => {
      app.testRouter.runPost(`/${namespace}/plugins/activate`, {pluginName: TEST_PLUGIN_NAME}).then(response => {
        done('activate not rejected');
      }).catch(status => {
        if (status.status === 500 && status.message.message === 'Action by UI denied')
          return done();
        done(status);
      });
    });

    it('uninstall route rejected', done => {
      app.testRouter.runPost(`/${namespace}/plugins/uninstall`, {pluginName: TEST_PLUGIN_NAME}).then(response => {
        done('uninstall not rejected');
      }).catch(status => {
        if (status.status === 500 && status.message.message === 'Action by UI denied')
          return done();
        done(status);
      });
    });

    it('deactivate route rejected', done => {
      app.testRouter.runPost(`/${namespace}/plugins/deactivate`, {pluginName: TEST_PLUGIN_NAME}).then(response => {
        done('deactivate not rejected');
      }).catch(status => {
        if (status.status === 500 && status.message.message === 'Action by UI denied')
          return done();
        done(status);
      });
    });
  });

});
