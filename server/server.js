/**
 * 
 * @desc Main to start the Next Generation Runtime
 * @version 3.0
 * @copyright 
 * @license Commercial
 */

'use strict';

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const log4js = require('log4js');
const engine = require('./engine');
const logger = log4js.getLogger('server.js');
const License = require('./license');
const StatsD = require('hot-shots');
const application = 'ng-rt-core';
const commands = require('../cli/commands/configure');
const fileExists = require('file-exists');
const licenseActivation = require('./licenseActivationClient.js');
const configConstants = require('../cli/configConstants').constants;
const LoopbackConfigService = require('./backend/LoopbackConfigService');
const CONFIG_IGNORE = ["databaseType", "datasources", "serverEnvironment", "blockchainClusterId",
  "clusterId", "envId", "instanceId", "tenantId", "defaultDomainId", "jwtAuthClusterId", "jwtAuthInstanceId", "jwtAuthTenantId",
  "bigchainMongoDBHost", "bigchainMongoDBPort"];

/**
 * API/Backend/Server
 *
 * @module API/Backend/Server
 * @type {object}
 */

module.exports = {
  start: async function(i18n, argv) {
    let configService = require('ng-configservice');
    configService.read('config/server/config.json');

    const iniService = require('./backend/iniService');

    process.env.HOSTNAME = os.hostname();
    process.env.BOOT_DATETIME = new Date();
    process.env.BUILD_DATETIME = require('../manifest.json').buildDateTime ? require('../manifest.json').buildDateTime : 'n.a';
    process.env.BUILD_VERSION = require('../manifest.json').version ? require('../manifest.json').version : 'n.a';
    process.env.BUILD_NUMBER = require('../manifest.json').build_number ? require('../manifest.json').build_number : 'n.a';
    // StatsD being used in many places to log statstic. Must faster then reading via configService.get('value')

    // to be able to update these 2 parameters in runtime
    configService.onadd(payload => {
      if (payload.field === 'ngrtStatsdHost') {
        process.env.ngrtStatsdHost = payload.value;
        configService.syncEnv();
      }
      if (payload.field === 'ngrtStatsdPort') {
        process.env.ngrtStatsdPort = payload.value;
        configService.syncEnv();
      }
    });

    // initial set
    process.env.ngrtStatsdHost = configService.get('ngrtStatsdHost');
    process.env.ngrtStatsdPort = configService.get('ngrtStatsdPort');

    const initExitListener = require('./exitHandler')(false, i18n);

    global.appBase = path.resolve(__dirname, "..");

    // to be sure the folders exist

    createFolder(path.join(__dirname, "..", iniService.get('core:dirConfig')));
    createFolder(path.join(__dirname, "..", iniService.get('core:dirPlugins')));
    createFolder(path.join(__dirname, "..", iniService.get('core:dirLog')));
    createFolder(path.join(__dirname, "..", iniService.get('core:dirConfigLicenses')));
    createFolder(path.join(__dirname, "..", iniService.get('core:dirConfigData')));
    createFolder(path.join(__dirname, "..", iniService.get('core:dirConfigDocs')));
    createFolder(path.join(__dirname, "..", iniService.get('core:dirConfigServer')));
    createFolder(path.join(__dirname, "..", iniService.get('core:dirConfigPlugins')));

    // check whether configuration file config/config.json exist
    // if not create it
    if (!fileExists.sync(configService.configFilePath)) {
      logger.info(i18n.__("The configuration file " + configService.configFilePath + " does not exist"));

      // this is like  process.exit();
      let result = await commands.prompt.get(configService);
      await commands.configConfig.create(configService, result, i18n);
      await commands.componentConfig.create(configService);
      await commands.log4js.create(configService);
      await commands.datasources.create(configService);
      await configService.stopWatching();
      configService = new LoopbackConfigService(i18n, configService);
      await configService.init();

      await commands.configDb.create(result, configService);
      await commands.serverConfig.create(configService);
      await commands.aws.init(configService);
      await commands.keys.generate(configService);
      return runServer(configService, i18n, argv, initExitListener);
    }

    await commands.datasources.create(configService);
    configService = new LoopbackConfigService(i18n, configService);
    await configService.init();
    await configService.loadFromFile(CONFIG_IGNORE);

    // StatsD being used in many places to log statstic. Must faster then reading via configService.get('value')
    process.env.ngrtStatsdHost = configService.get('ngrtStatsdHost');
    process.env.ngrtStatsdPort = configService.get('ngrtStatsdPort');

    // now config is exist
    // then update current config with process.env variables
    updateMainConfig()
      .then(() => {
        // License Activation check function call
        return licenseActivation.checkLicenseOnStart();
      })
      .then(() => {
        runServer(configService, i18n, argv, initExitListener);
      })
      .catch(err => {
        logger.error(i18n.__(err));
        processExit(err);
      });

    /**
     * Replacing fields in config.json to variables from environment.
     * Tests are replaced in: test/manual/updateConfig
     *
     * @return {Promise} array of configService.add() results
     */
    function updateMainConfig() {
      let update = [];
      Object.keys(configConstants).forEach(field => {
        // search fields in config which equals fields from constants
        const valueFromConfig = configService.get(field, 'noField');
        if (valueFromConfig === 'noField' || typeof (configConstants[field].processEnv) === 'undefined') {
          return;
        }
        // field autoUpdate is object, but in constants is string
        if (field === 'autoUpdate') {
          const autoUpdField = 'autoUpdate:active';
          if (configConstants.autoUpdate.processEnv === 'true') {
            update.push(configService.add(autoUpdField, true, true));
            return;
          }
          if (configConstants.autoUpdate.processEnv === 'false') {
            update.push(configService.add(autoUpdField, false, true));
            return;
          }
        }
        // just replace this config row with value from constants (which may include process.env)
        if (configConstants[field].processEnv !== valueFromConfig) {
          update.push(configService.add(field, configConstants[field].processEnv, true));
          return;
        }
      });
      return Promise.all(update);
    }

    /**
      * To exit the process when License is not activated and 30 day period has ended
      *
      * @method processExit
      * @param {err} err Error
      */
    function processExit(err) {
      logger.error(i18n.__(err.message));
      process.exit(100);
    }
    // end of License Activation check
  }
};

/**
 * creates all required files for starting the server
 * @param {object}  configService - The object instance of the configService
 * @param {object}  i18n - The object instance of the i18n
 * @param {object}  argv - command line parameters
 * @param {function} initExitListener - function for init exit listeners
 */
function runServer(configService, i18n, argv, initExitListener) {
  const license = new License(configService.configFilePath, i18n);
  const licenseFilePath = path.resolve(global.appBase, 'config', 'licenses', 'ng-rt-core.lic');

  configServer(configService)
    .then(() => {
      if (!argv.skiplicense || typeof argv.skiplicense === 'undefined') {
        if (fileExists.sync(licenseFilePath)) {
          license.checkLicense(configService, application, function(error, licenseResult) {
            if (error || !licenseResult) {
              logger.error(i18n.__('0676 : Invalid license or license file'));
              process.exit(100);
            }

            i18n.setLocale(configService.get('i18n:defaultLocale'));

            // Statistic server.
            var client = new StatsD({
              host: (process.env.ngrtStatsdHost || '127.0.0.1'),
              port: (process.env.ngrtStatsdPort || '8125'),
              errorHandler: error => logger.error('StatsD exception:', error.message)
            });

            client.increment(`server, method=boot`);
            engine.start(configService, licenseResult, i18n, application, argv, initExitListener);
            // });
          });
        } else {
          logger.trace.log('argv :', argv);
          logger.warn(i18n.__('0004 : no license file in folder config/licenses found'));
          process.exit(1);
        }
      } else {
        i18n.setLocale(configService.get('i18n:defaultLocale'));
        logger.debug(i18n.__('Skip license check'));
        // Statistic server.
        var client = new StatsD({
          host: (process.env.ngrtStatsdHost || '127.0.0.1'),
          port: (process.env.ngrtStatsdPort || '8125'),
          errorHandler: error => logger.error('StatsD exception:', error.message)
        });

        client.increment(`server, method=boot`);

        engine.start(configService, true, i18n, application, argv, initExitListener);
      }
    })
    .catch(err => logger.error(err));
}
/**
 * creates all required files for starting the server
 * @param {Object} configService - The instance of the configService
 * @return {Promise} result
 */
function configServer(configService) {
  return commands.log4js.create(configService)
    .then(() => commands.serverConfig.create(configService))
    .then(() => commands.componentConfig.create(configService))
    .then(() => commands.aws.init(configService))
    .then(() => configService.stopWatching())
    .catch(err => Promise.reject(err));
}

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
