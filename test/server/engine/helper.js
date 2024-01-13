// common helper module for integration tests against ng-rt engine
// it's purpose to initialize and start ng-rt engine
"use strict";
const path = require('path');
const events = require('events');
global.appBase = path.resolve(__dirname, '../../..'); // root path for ng-rt
const commands = require('../../../cli/commands/configure');
const log4jsService = require("../../../server/backend/log4jsService");
const fs = require("fs");

// const ConfigFiles = require(path.resolve(global.appBase, 'cli/commands/configure/services/configFiles'));
// const configFiles = new ConfigFiles();

/**
 * Creates a new folder
 * @param {string} folder - The name of the folder to be created
 */
function createFolder(folder) {
  try {
    fs.lstatSync(folder);
  } catch (e) {
    fs.mkdirSync(folder);
  }
}

var eventEmitterAuthPluginActivated = new events.EventEmitter();
var waitForAuthPluginActivated = function () {
  return new Promise(resolve => {
    var onAfterAuthPluginActivate = function () {
      eventEmitterAuthPluginActivated.removeListener('activated', onAfterAuthPluginActivate);
      resolve();
    };
    eventEmitterAuthPluginActivated.on('activated', onAfterAuthPluginActivate);
  });
};

var _initRunned = false;
const engineHelper = {
  init: init
};
function init() {
  // if an engine wrapped by handler is already initialized
  if (engineHelper.app)
    // then just resolve the promise
    return Promise.resolve();

  if (_initRunned) {
    return waitForAuthPluginActivated();
  }
  _initRunned = true;

  createFolder(path.join(__dirname, "..", "..", "..", "log"));
  log4jsService.init();

  // load, configure and start ng-rt engine
  var _engine = require(path.join(global.appBase, 'server/engine'));
  const configService = require('ng-configservice');
  configService.read('config/server/config.json');

  /* eslint-disable no-console */
  console.log('global.appBase', global.appBase);
  /*
  configFiles.createDatasources(configService);
  configFiles.createConfig(configService);
  configFiles.initAWS(configService);
  */

  commands.datasources.create(configService);
  commands.serverConfig.create(configService);
  commands.aws.init(configService);

  global.appRoot = path.resolve(__dirname);
  var localFolder = path.join(__dirname, "..", "locales");
  var i18n = require('i18n');
  i18n.configure({
    locales: ['en', 'de', 'ru'],
    directory: localFolder,
    defaultLocale: 'en',
    register: global
  });

  var argv = require('minimist')(process.argv.slice(2));
  let failed = false;
  const emitterReady = pluginsEvents => {
    const onPluginManagerStatus = function () {
      // save to the helper loopback instance
      // engineHelper.app = _engine.app;

      // we don't need to listen anymore
      pluginsEvents.removeListener('status', onPluginManagerStatus);

      // update another waiters
      eventEmitterAuthPluginActivated.emit('activated');
    };
    pluginsEvents.on('ready', onPluginManagerStatus);

    const onAllPluginsInstalledAndActivated = function () {
      // we don't need to listen anymore
      pluginsEvents.removeListener('status', onPluginManagerStatus);
      eventEmitterAuthPluginActivated.emit();
    };
    pluginsEvents.on('ALL_PLUGINS_INSTALLED', onAllPluginsInstalledAndActivated);
    pluginsEvents.on('ERROR_PLUGINS_INSTALL', () => {
      failed = true;
    });
  }


  return _engine.start(configService, {}, i18n, "ng-rt-core", argv, false, emitterReady)
    .then(server => {
      // and node.js server instance
      engineHelper.server = server;
      engineHelper.app = _engine.services.get('loopbackApp');
      engineHelper.services = _engine.services;

      return new Promise((resolve, reject) => {
        if (failed === true)
          return reject();
        resolve();
      });
    });
}

module.exports = engineHelper;
