/**
 * ng-rt engine main module.
 * it's the core of the system.
 */
'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('engine');
const connectivityService = require('./backend/connectivityService');
const LoopbackConfigService = require('./backend/LoopbackConfigService');
require('./backend/context');
const {common} = require('ng-common');

const engine = {
  services: require('./services')
};
module.exports = engine;

/**
 * Main method to start the engine.
 * @param  {object} configService  configService instance
 * @param  {type}      licenseResult the license
 * @param  {type}      i18n i18n service
 * @param  {type}      applicationName ng-rt-core application name
 * @param  {type}      argv Object of type argv
 * @param {function} initExitListener function for init exit listener
 * @param {function} pluginManagerEventsReady function call if plugin manager events emitter is ready and pass emitter as parameter
 * @return {Promise.<server>}          instance of started HTTP server
 */
engine.start = async (configService, licenseResult, i18n, applicationName, argv, initExitListener, pluginManagerEventsReady) => {
  const ioc = require('./ioc')(engine.services);
  engine.services.addDirectly('initialConfigService', configService);

  /**
   * @module API/Service/i18n
   * @see {@link https://github.com/mashpie/i18n-node|i18n}
   */
  engine.services.addDirectly('i18n', i18n);

  const utils = ioc.load('./utils');
  ioc.load('./backend/context');

  engine.services.add('iniService', require('./backend/iniService'));
  engine.services.add('log4jsService', require('./backend/log4jsService'));
  engine.services.add('rethinkdb', require('./backend/rethinkdb'));
  engine.services.add('dataRoutingService', require('./services/dataRoutingService')(configService));
  engine.services.add('keys', require('../utils/keys'));
  engine.services.add('bs58', require('../utils/bs58'));
  engine.services.addDirectly('objectId', require('mongodb').ObjectID);
  engine.services.add('rabbitMQ', require('./services/rabbitMQ')(configService));
  engine.services.add('exitListener', require('./services/exitListener')(initExitListener, i18n));
  ioc.load('./services/rabbitMQWatcher');
  engine.services.add('licenseActivationClient', require('../server/licenseActivationClient'));
  engine.services.add('metricsClient', require('./services/metricsClient'));
  engine.services.add('crypto', await common.crypto());

  ioc.load('./backend/vault');

  // ToDo?
  // ioc.load('./backend/mongoDb');

  await initDataSources(configService);

  // set version of CORE
  process.env.CORE_VERSION = require('../manifest.json') ? require('../manifest.json').version : '';

  await connectivityService.check(engine.services, configService, argv, i18n);

  // run loopback
  await ioc.load('./httpService');

  // after loopback is instantiated
  const app = engine.services.get('loopbackApp');
  let dbConfigService = new LoopbackConfigService(i18n, configService, app);
  await dbConfigService.init();
  engine.services.remove('initialConfigService');
  engine.services.add('configService', dbConfigService);

  // create server and listen
  const server = await app.serve();
  engine.services.add('httpServer', server);

  app.applicationName = applicationName;

  app.emit('started');
  const baseUrl = app.get('url').replace(/\/$/, '');
  logger.info(i18n.__('0018 : Web server listening at: %s', baseUrl));

  if (app.get('ng-rt-data-explorer')) {
    const dataExplorerPath = app.get('ng-rt-data-explorer').mountPath;
    logger.info(i18n.__('0020 : Starting Data Explorer at %s%s', baseUrl, dataExplorerPath));
  }

  // services depends on loopback app
  engine.services.add('fidoCredentials', require('./services/fidoCredential')(app));
  engine.services.add('yubikeys', require('./services/yubikeys')(app, utils));
  engine.services.add('pubkeys', require('./services/pubkeys')(app));
  ioc.load('./services/storedKeys');
  ioc.load('./services/loopbackModelDecorator');

  if (configService.get('performance')) {
    require('performance').routes(app);
  }

  await require('./backend/pluginManager')(app, engine.services.get('configService'), engine.services);
  let syncConfig = configService.get('configFeed');
  if (syncConfig && syncConfig.enabled === true)
    require('./backend/configFeed')(engine.services, app.plugin_manager.configs);

  let wsConfig = configService.get('websocket');

  if (wsConfig && wsConfig.enabled === true) {
    setTimeout(() => {
      ioc.load('./wsServer');
    }, 5000);
  }

  return server;
};

/**
 *
 * @param {*} configService Instance of the configService
 */
async function initDataSources(configService) {
  const dataSources = configService.get('datasources');
  if (!dataSources) {
    logger.error('No dataSources in config');
    return;
  }
  await Object.keys(dataSources).forEach(async name => {
    const dsRecord = dataSources[name];
    if (!dsRecord.factory)
      return;
    const dsFactory = engine.services.get(dsRecord.factory);
    if (dsFactory) {
      const ds = await dsFactory.connect(dsRecord);
      if (ds) {
        engine.services.add(name, ds);
      }
    }
  });
}
