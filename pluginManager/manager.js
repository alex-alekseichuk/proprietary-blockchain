'use strict';
const logger = require('log4js').getLogger('plugins_manger/manager.js');
const glob = require('glob');
const EventEmitter = require('events').EventEmitter;
const path = require("path");
const FilePluginsStorage = require("./FilePluginsStorage");
const ConfigurationManager = require("./ConfigurationManager");
const hashUtils = require('../utils/hash');
const fs = require('fs');

/**
 * Plugins manager
 * @param {object} server instance of application
 * @param {object} configService config service, manage system configs
 * @param {object} services services manager
 * @return {object} instancee
 */
function PluginManager(server, configService, services) {
  let eventEmitter = new EventEmitter();
  let appRepo = require('./applicationRepo')(server.models.plugin);
  let i18n = services.get('i18n');
  let dependencies = require("./dependencies")(configService, i18n);
  logger.debug(i18n.__("Init PluginManager"));
  let actions = {};
  let entryPoints = {};
  let pluginS3UrlTemplate = require('../manifest.json').pluginS3UrlTemplate ? require('../manifest.json').pluginS3UrlTemplate : '${FILE_NAME}';
  // let i18n = services.get('i18n');
  // var services = global.serviceManager = require('./services')();
  global.serviceManager = services;
  var configurationManager = new ConfigurationManager([], configService.get("plugins_data_path", "config/data"), getStorageByPlugin, appRepo, services);
  let pluginsStorages = {
    main: new FilePluginsStorage("main", "Main", services, {
      folder: configService.get('plugins-path', 'plugins')
    }, i18n, configService.get("lockUpdate"))
  };
  let activatedPluginsVersions = {};
  // var filemanager = require('./filemanager')(configService, configService.get('plugins-path', 'plugins'));
  let additionalPluginsStorages = configService.get("additionalPluginsStorages");
  if (additionalPluginsStorages) {
    Object.keys(additionalPluginsStorages).forEach(key => {
      let addSettings = additionalPluginsStorages[key];
      if (pluginsStorages[key])
        return logger.error(i18n.__("PluginsStorage with id", key, "already registered"));
      let TypeOfStorage = FilePluginsStorage;
      if (addSettings.type)
        TypeOfStorage = require("./" + addSettings.type);
      pluginsStorages[key] = new TypeOfStorage(key, addSettings.title, services, addSettings.parameters, services.get("i18n"), configService.get("lockUpdate"));
    });
  }

  let licenseManager = require("./license_manager")(configService.configFilePath, services, server.applicationName);

  let exitListener = services.get('exitListener');
  if (exitListener) {
    exitListener.add('pluginManagerDeactivator', () => {
      return deactivateOnExit();
    });
  }

  let pluginsFeed;

  /**
   * Init configuration manager in database
   */
  async function initDb() {
    await configurationManager.initDb(i18n, server);
  }

  // rabbitMQ.subscribeToFanoutExchange(MESSAGES.UPDATE, message => {
  //   logger.debug(i18n.__("Message:", MESSAGES.UPDATE, message);
  // });

  appRepo.resetActivated();

  /**
   * get plugins storage
   * @param {string} storage name
   * @return {object} instance of plugins storage
   */
  function getStorage(storage) {
    if (!storage)
      return pluginsStorages.main;
    if (!pluginsStorages[storage]) {
      logger.error(i18n.__("No storage with id", storage));
      return;
    }
    return pluginsStorages[storage];
  }

  /**
   * init entry points systems
   */
  function initEntryPoints() {
    let points = glob.sync('./entry_points/*.js', {
        cwd: __dirname,
        realpath: true
      })
      .map(filename => require(filename))
      .filter(point => typeof point === 'function');
    points.forEach(point => point(entryPoints, configService));
  }

  initEntryPoints();

  /**
   * init plugin manager actions system
   */
  function initActions() {
    let actionFiles = glob.sync('./actions/*.js', {
        cwd: __dirname,
        realpath: true
      })
      .map(filename => require(filename))
      .filter(action => typeof action === 'function');
    actionFiles.forEach(action => action(actions, configService, i18n));
  }

  initActions();

  /**
   * activate all plugins
   */
  function activateAll() {
    getPlugins(pluginName => {
      activate(pluginName);
    });
  }

  /**
   * add plugin from archive file
   * @param {string} filepath archive file path
   * @param {string} storage name of storage, main if not defined
   * @return {Promise.<string>} resolve plugin name on plugin added
   */
  function addFromArchive(filepath, storage) {
    logger.debug(i18n.__('from archive', filepath));
    return getStorage(storage).unpack(filepath);
  }

  /**
   * add from git reepository
   * @param {string} giturl git repository url
   * @param {string} storage name of storage, main if not defined
   * @return {Promise.<string>} resolve plugin name on plugin added
   */
  function addFromGit(giturl, storage) {
    return new Promise((resolve, reject) => {
      logger.debug(i18n.__('from git', giturl));
      let urls = giturl.split('#');
      let branch;
      if (urls.length > 1) {
        branch = urls[1];
      } else {
        if (process.env.BUILD_ID && process.env.BUILD_ID.indexOf("D") > -1) {
          branch = "development";
        }
        if (process.env.BUILD_ID && process.env.BUILD_ID.indexOf("C") > -1) {
          branch = "consolidation";
        }
        if (process.env.BUILD_ID && process.env.BUILD_ID.indexOf("CA") > -1) {
          branch = "production";
        }
        if (process.env.BUILD_ID && process.env.BUILD_ID.indexOf("GA") > -1) {
          branch = "public-production";
        }
      }
      let strg = getStorage(storage);
      logger.trace(i18n.__("Start wait unlock"));
      waitUnlock(strg).then(() => {
          logger.trace(i18n.__("UNLOCKED"));
          return lock(strg);
        }).then(() => {
          return strg.gitclone(urls[0], branch);
        }).then(resolve).catch(reject)
        .then(() => {
          logger.trace(i18n.__("unlock"));
          return unlock(strg);
        });
    });
  }

  /**
   * check plugin settings for changes, and save hash
   * @param {string} plugin name of plugin
   * @param {object} manifest plugin manifest objesct
   * @param {object} pluginConfiguration plugin configuration managr
   * @return {Promise} resolve on completed
   */
  function checkSettings(plugin, manifest, pluginConfiguration) {
    return new Promise(async(resolve, reject) => {
      logger.debug(i18n.__('check settings for', plugin));
      if (manifest.settings && manifest.settings.length > 0) {
        pluginConfiguration.reload();
        for (const sett of manifest.settings) {
          if (!pluginConfiguration.get(sett.name)) {
            await pluginConfiguration.set(sett.name, sett.value);
          }
        }
        if (!pluginConfiguration.get("_hash"))
          await pluginConfiguration.set("_hash", pluginConfiguration.hash);
        pluginConfiguration.save(err => {
          if (err)
            return reject(err);
          resolve();
        });
      } else
        resolve();
    });
  }

  /**
   * install plugin
   * @param {string} plugin name of plugin
   * @param {number} order plugin order
   * @param {object} parameters install parameters
   * @param {Boolean} publishToFeed true if publish to cluster plugins feed
   * @return {Promise} resolve on install completed
   */
  async function install(plugin, order, parameters, publishToFeed) {
    return new Promise(async(resolve, reject) => {
      logger.info(`${i18n.__('install plugin')}: ${plugin}`);
      let manifest;
      let source;
      let appOrder;
      let version = "";
      let strg = getStorageByPlugin(plugin);
      let dependeciesCheckResult;
      logger.trace(i18n.__("Start wait unlock"));
      let pluginConfiguration = await configurationManager.getWithAdd(plugin);
      waitUnlock(strg)
        .then(() => {
          logger.trace(i18n.__("UNLOCKED"));
          return lock(strg);
        }).then(() => {
          return appRepo.messages.install.clear(plugin);
        }).then(() => {
          logger.debug(i18n.__('check dependencies on install for plugin'), plugin);
          return checkDependencies(plugin);
        }).then(r => {
          dependeciesCheckResult = r;
          logger.debug(i18n.__('dependecies check result'), dependeciesCheckResult);
          if (!dependeciesCheckResult || dependeciesCheckResult.length === 0)
            return Promise.resolve();
          if (parameters && parameters.exceptionByDependencies)
            return Promise.reject(dependeciesCheckResult);
          return Promise.resolve();
        }).then(() => {
          return strg.getManifest(plugin);
        }).then(man => {
          manifest = man;
          logger.trace(i18n.__('manifest retrieved'));
          if (eventEmitter) eventEmitter.emit("status", 'manifest goted');
          logger.trace(manifest.actions);
          return runActions(plugin, "before_install", manifest.actions, strg, eventEmitter);
        }).then(() => {
          return checkSettings(plugin, manifest, pluginConfiguration);
        }).then(() => {
          logger.trace(i18n.__('get source'));
          return strg.source(plugin);
        }).then(src => {
          source = src;
          if (!order && order !== 0)
            return appRepo.getNextOrder();
          return Promise.resolve(order);
        }).then(ord => {
          appOrder = ord;
          logger.debug(i18n.__("order:", appOrder));
          logger.trace(i18n.__('get version'));
          return strg.version(plugin);
        }).then(vers => {
          if (manifest.version)
            version = manifest.version;
          if (vers)
            version += vers;
          return appRepo.findOne(plugin);
        }).then(plRecord => {
          if (plRecord) {
            logger.debug(i18n.__('update application', version, manifest.type, manifest.htmlHelpFile, source, strg.id, manifest.useAsApp, manifest.useAsSubscription));
            if (eventEmitter) eventEmitter.emit("status", 'update application, version:', version);
            return appRepo.update(plugin, version, manifest.type, manifest.htmlHelpFile, source, strg.id, manifest.useAsApp, manifest.useAsSubscription);
          }
          logger.trace(i18n.__('create application'));
          if (eventEmitter) eventEmitter.emit("status", 'create application');
          return appRepo.create(plugin, version, manifest.type, manifest.htmlHelpFile, source, strg.id, manifest.useAsApp, manifest.useAsSubscription, appOrder);
        }).then(() => {
          if (dependeciesCheckResult && dependeciesCheckResult.length > 0)
            return Promise.all(dependeciesCheckResult.map(err => appRepo.messages.install.add(plugin, err.message)));
          return Promise.resolve();
        }).then(() => {
          logger.trace(i18n.__('run after install actions'));
          if (eventEmitter) eventEmitter.emit("status", 'run after install actions');
          return runActions(plugin, "after_install", manifest.actions, strg, eventEmitter);
        }).then(resolve)
        .catch(reject)
        .then(() => {
          if (publishToFeed)
            pluginsFeed.publishPluginOperation(plugin, strg, pluginsFeed.MESSAGES.INSTALLED, { order, parameters });
          return unlock(strg);
        });
    });
  }

  /**
   * unistall plugin
   * @param {string} plugin name of plugin
   * @param {boolean} isUpdate true if uninstalling by plugin update
   * @param {boolean} publishToFeed true if publish to cluster plugins feed
   * @return {Promise} resolve on uninstall completed
   */
  const uninstall = (plugin, isUpdate, publishToFeed) => {
    return new Promise((resolve, reject) => {
      logger.info(`${i18n.__('uninstall plugin')}: ${plugin}`);
      let manifest;
      let strg = getStorageByPlugin(plugin);
      logger.trace(i18n.__("Start wait unlock"));
      waitUnlock(strg).then(() => {
          logger.trace(i18n.__("UNLOCKED"));
          return lock(strg);
        }).then(() => {
          return appRepo.messages.uninstall.clear(plugin);
        }).then(() => {
          return strg.getManifest(plugin);
        }).then(man => {
          logger.trace(i18n.__("got manifest"));
          manifest = man;
          if (man.type === "mandatory" && !isUpdate) {
            logger.debug(i18n.__('Try to remove mandatory plugin'));
            throw new Error('plugin is mandatory');
          }
          eventEmitter.emit("status", "run before uninstall actions");
          return runActions(plugin, "before_uninstall", manifest.actions, strg, eventEmitter);
        }).then(() => {
          if (isUpdate) {
            return Promise.resolve();
          }
          logger.trace(i18n.__('remove from db'));
          eventEmitter.emit("status", "remove from db");
          return appRepo.remove(plugin);
        }).then(() => {
          logger.trace(i18n.__('after uninstall'));
          eventEmitter.emit("status", "run after uninstall actions");
          return runActions(plugin, "after_uninstall", manifest.actions, strg, eventEmitter);
        }).then(() => {
          configurationManager.remove(plugin);
          return resolve();
        }).catch(reject)
        .then(() => {
          if (publishToFeed)
            pluginsFeed.publishPluginOperation(plugin, strg, pluginsFeed.MESSAGES.UNINSTALLED);
          logger.trace(i18n.__("unlock"));
          unlock(strg);
        });
    });
  };

  /**
   * check plugin license
   * @param {string} plugin name of plugin
   * @param {object} manifest plugin manifest instance
   * @return {number} result code
   */
  function checkLicense(plugin, manifest) {
    if (manifest.checkLicense) {
      logger.debug(i18n.__("Check license", plugin));
      return licenseManager.checkLicense(plugin, configurationManager.plugin(plugin).path.absolute);
    }
    return 0;
  }

  /**
   * check plugin dependencies
   * @param {*} pluginName plugin name
   * @return {Promise.<Array>} resolve array of errors-result of checks, empty if check is ok
   */
  function checkDependencies(pluginName) {
    let strg = getStorageByPlugin(pluginName);
    let manifest;
    return strg.getManifest(pluginName).then(man => {
      manifest = man;
      return appRepo.find();
    }).then(installed => dependencies.check(manifest.dependencies, installed));
  }

  /**
   * activate plugin
   * @param  {string} plugin name
   * @param {Boolean} publishToFeed true if need publishing to feed
   * @return {Promise} resolve on plugin activated
   */
  function activate(plugin, publishToFeed) {
    return new Promise(async(resolve, reject) => {
      logger.info(`${i18n.__('activate plugin:')} ${plugin}`);
      let manifest;
      let strg = getStorageByPlugin(plugin);
      await configurationManager.getWithAdd(plugin);
      let pluginInstance = configurationManager.plugin(plugin);
      logger.trace(i18n.__("Start wait unlock"));
      waitUnlock(strg).then(() => {
          logger.trace(i18n.__("UNLOCKED"));
          return lock(strg);
        }).then(() => {
          return pluginInstance.repo.clearActivateMessages();
        }).then(() => {
          return strg.getManifest(plugin);
        }).then(man => {
          manifest = man;
          return checkLicense(plugin, manifest);
        }).then(state => {
          pluginInstance.repo.setLicenseState(state);
          logger.trace(i18n.__("license state", state));
          if (state > 1) {
            pluginInstance.repo.addActivateMessage(licenseManager.MESSAGES[state]);
            return Promise.reject("no license");
          }
          return runActions(plugin, "before_activate", manifest.actions, strg, eventEmitter);
        }).then(() => {
          logger.trace(i18n.__('run entry points'));
          if (eventEmitter) eventEmitter.emit("status", 'run entry points');
          return runEntryPoints(plugin, manifest.entryPoints, strg);
        }).then(() => {
          logger.trace(i18n.__('activate in db'));
          if (eventEmitter) eventEmitter.emit("status", 'activate in db');
          return pluginInstance.repo.setActivation();
        }, err => {
          logger.error(err);
          return reject(err);
        }).then(() => {
          if (eventEmitter) eventEmitter.emit("status", 'after activate', plugin);
          return runActions(plugin, "after_activate", manifest.actions, strg, eventEmitter);
        }).then(() => {
          pluginInstance.repo.setActivated(true);
          return resolve();
        }).catch(reject)
        .then(() => {
          return pluginInstance.executeTests().then(res => {
            return pluginInstance.repo.clearSmokeTestMessages().then(() => {
              if (!res || res.length === 0)
                return Promise.resolve();
              return Promise.all(res.map(r => pluginInstance.repo.addSmokeTestMessage(r)));
            });
          });
        }, reject).then(() => {
          logger.trace(i18n.__("unlock"));
          return unlock(strg);
        }).then(() => {
          appRepo.findOne(plugin);
        }).then(pluginApp => {
          if (pluginApp)
            activatedPluginsVersions[plugin] = pluginApp.version;
          if (publishToFeed === true)
            pluginsFeed.publishPluginOperation(plugin, strg, pluginsFeed.MESSAGES.ACTIVATED);
          return Promise.resolve();
        });
    });
  }

  /**
   * deactivatee plugin
   * @param  {string} plugin name
   * @param  {boolean} force true if deactivating by plugin update
   * @param  {boolean} publishToFeed true if need publish to plugins feed
   * @return {Promise} resolve on deactivate completed
   */
  function deactivate(plugin, force, publishToFeed) {
    return new Promise(async(resolve, reject) => {
      logger.info(`${i18n.__('Deactivate plugin')}: ${plugin}`);
      let manifest;
      let strg = getStorageByPlugin(plugin);
      await configurationManager.getWithAdd(plugin);
      logger.trace(i18n.__("Start wait unlock"));
      waitUnlock(strg).then(() => {
        logger.trace(i18n.__("UNLOCKED"));
        return lock(strg);
      }).then(() => {
        return appRepo.messages.deactivate.clear(plugin);
      }).then(() => {
        return strg.getManifest(plugin);
      }).then(man => {
        manifest = man;
        if (eventEmitter) eventEmitter.emit("status", "begin deactivate");
        if (man.type === "mandatory" && !force) {
          reject('plugin is mandatory');
          throw new Error('Plugin is mandatory');
        } else return runActions(plugin, "before_deactivate", manifest.actions, strg);
      }).then(() => {
        if (eventEmitter) eventEmitter.emit("status", "deactivate entry points");
        return deactivateEntryPoints(plugin, manifest.entryPoints, strg);
      }).then(() => {
        if (eventEmitter) eventEmitter.emit("status", "set deactivated");
        return appRepo.setActivation(plugin, true);
      }).then(() => {
        if (eventEmitter) eventEmitter.emit("status", "after deactivate");
        return runActions(plugin, "after_deactivate", manifest.actions, strg);
      }).then(() => {
        appRepo.setActivated(plugin, false);
        return resolve();
      }, reject).then(() => {
        logger.trace(i18n.__("unlock"));
        return unlock(strg);
      }).then(() => {
        delete activatedPluginsVersions[plugin];
        if (publishToFeed === true)
          pluginsFeed.publishPluginOperation(plugin, strg, pluginsFeed.MESSAGES.DEACTIVATED);
        return Promise.resolve();
      });
    });
  }

  const remove = (pluginName, isUpdate, publishFeed) => {
    return new Promise((resolve, reject) => {
      logger.info(`${i18n.__('remove plugin')}: ${pluginName}`);
      let strg = getStorageByPlugin(pluginName);
      logger.trace(i18n.__("Start wait unlock"));
      waitUnlock(strg).then(() => {
          logger.trace(i18n.__("UNLOCKED"));
          return lock(strg);
        }).then(() => {
          return strg.getManifest(pluginName);
        }).then(man => {
          if (!man)
            return Promise.resolve();
          if (man.type === "mandatory" && !isUpdate) {
            reject('plugin is mandatory');
            throw new Error('Plugin is mandatory');
          }
          return strg.removePluginDir(pluginName);
        }).then(async() => {
          if (eventEmitter) eventEmitter.emit("status", "removed");
          let pluginConfig = await configurationManager.getWithAdd(pluginName);
          pluginConfig.reload();
          let curHash = pluginConfig.get("_hash");
          if (configService.get("autoUpdate.protectModifiedConfig") === true && curHash && pluginConfig.hash && curHash !== pluginConfig.hash)
            return Promise.resolve();
          return configurationManager.remove(pluginName);
        }).then(resolve, reject)
        .then(() => {
          if (publishFeed)
            pluginsFeed.publishPluginOperation(pluginName, strg, pluginsFeed.MESSAGES.REMOVED);
          logger.trace(i18n.__("unlock"));
          return unlock(strg);
        });
    });
  };

  /**
   * run plugin action
   * @param {string} plugin name
   * @param {Array} acts list of plugin action to run
   * @param {number} i index of action
   * @param {string} pluginPath plugin path
   * @return {Promise} resolve on action runned
   */
  function runAction(plugin, acts, i, pluginPath) {
    return new Promise((resolve, reject) => {
      if (i >= acts.length) {
        logger.trace(i18n.__('actions resolved'));
        resolve();
        return;
      }

      var act = acts[i];
      // logger.debug(i18n.__('run action', act);

      var a = actions[act.type.toUpperCase()];

      if (typeof a === 'object') {
        if (configService.get('containerStatus.immutable') === true && a.mutateContainer === true && act.skipMutableCheck !== true) {
          logger.debug(i18n.__('Immutable container, action prohibited'));
          return runAction(plugin, acts, i + 1, pluginPath, eventEmitter).then(resolve);
        }
        a = a.callback;
      }

      if (eventEmitter) eventEmitter.emit(`status ${act.type} --> ${i}`);

      // eventEmitter.emit('status', 'run action:');

      if (a) {
        a(configurationManager.plugin(plugin), act.parameters, server, eventEmitter).then(() => {
          // console.log("run action:", i + 1);

          runAction(plugin, acts, i + 1, pluginPath, eventEmitter).then(resolve);
        }).catch(err => {
          logger.error(i18n.__('run action error'), plugin, act.type, act.parameters, err);
          eventEmitter.emit("error_message", err);
          logger.trace(i18n.__("run next action"));
          runAction(plugin, acts, i + 1, pluginPath, eventEmitter).then(resolve);
        });
      } else
        reject('no action type', act);
    });
  }

  /**
   * run stage of plugin actions
   * @param {string} plugin name of plugin
   * @param {string} type type of action (before_install, after_install, before_activate, after_activate, before_uninstall, after_uninstall, before_deactivate, after_deactivate)
   * @param {Array} acs list of plugin actions
   * @param {object} storage instance of plugins storage
   * @return {Promise} resolve on all actions completed
   */
  function runActions(plugin, type, acs, storage) {
    return new Promise((resolve, reject) => {
      logger.trace('run actions', plugin, type);
      if (acs && acs[type] && acs[type].length > 0) {
        let pluginFolder = path.resolve(storage.folder, plugin);
        runAction(plugin, acs[type], 0, pluginFolder, eventEmitter).then(resolve, reject);
      } else {
        return resolve();
      }
    });
  }

  /**
   * run plugin entry point
   * @param {string} plugin name of plugins
   * @param {Array} points list of plugin entry points
   * @param {number} i index of entrypoint
   * @param {*} storage plugin storage
   * @return {Promise} resolve on entry point completed
   */
  function runEntryPoint(plugin, points, i, storage) {
    return new Promise((resolve, reject) => {
      // logger.debug(i18n.__(i);
      if (!points)
        return resolve();
      if (i >= points.length) {
        logger.trace(i18n.__('entry points resolved'));
        resolve();
        return;
      }
      let point = points[i];
      // logger.debug(i18n.__('run entry point', point);
      if (entryPoints[point.type]) {
        entryPoints[point.type](plugin, point.parameters, server, configurationManager.plugin(plugin)).then(() => {
          // j = i+1;
          // logger.debug(i18n.__('second', i+1);
          runEntryPoint(plugin, points, i + 1, storage).then(resolve).catch(reject);
        }).catch(reject);
      } else {
        reject('no entry point type ' + point.type);
      }
    });
  }

  /**
   * deactivate entry point
   * @param {string} plugin name of plugin
   * @param {Array} points list of entry points
   * @param {number} i index of entry point
   * @param {string} storage plugins storage
   * @return {Promise} resolve on entry point deactivated
   */
  function deactivateEntryPoint(plugin, points, i, storage) {
    return new Promise((resolve, reject) => {
      logger.trace(i);
      if (!points)
        return resolve();
      if (i < 0) {
        logger.trace(i18n.__('deactivate entry points resolved'));
        resolve();
        return;
      }
      let point = points[i];
      logger.trace(i18n.__('run entry point', point));
      if (entryPoints[point.type + "_deactivate"]) {
        entryPoints[point.type + "_deactivate"](plugin, point.parameters, server, configurationManager.plugin(plugin)).then(() => {
          // j = i+1;
          // logger.debug(i18n.__('second', i+1);
          deactivateEntryPoint(plugin, points, i - 1, storage).then(resolve, reject);
        }).catch(reject);
      } else {
        deactivateEntryPoint(plugin, points, i - 1, storage).then(resolve, reject);
      }
    });
  }

  /**
   * run plugin entry points
   * @param {string} plugin name of plugin
   * @param {Array} points list of entry points
   * @param {string} storage plugins storage
   * @return {Promise} resolve on all entry points activated
   */
  function runEntryPoints(plugin, points, storage) {
    logger.trace(i18n.__('run entry points '));
    return runEntryPoint(plugin, points, 0, storage);
  }

  /**
   * deactivate plugin entry points
   * @param {string} plugin name of plugin
   * @param {Array} points list of entry points
   * @param {string} storage plugins storage
   * @return {Promise} resolve on all entry points activated
   */
  function deactivateEntryPoints(plugin, points, storage) {
    logger.trace(i18n.__('deactivate entry points', plugin));
    return deactivateEntryPoint(plugin, points, (points ? points.length - 1 : 0), storage);
  }

  /**
   * get added plugins
   * @return {Promise} list of addedplugins
   */
  function getAdded() {
    return new Promise((resolve, reject) => {
      let dirs = [];
      Object.keys(pluginsStorages).forEach(key => {
        let storage = pluginsStorages[key];
        let plugins = storage.getAdded();
        plugins.map(plugin => {
          return dirs.push({
            name: plugin,
            storage: storage.id
          });
        });
      });
      resolve(dirs);
    });
  }

  /**
   * get installed plugins
   * @return {Promise} resolve list of installed plugins
   */
  function getPlugins() {
    return new Promise((resolve, reject) => {
      getAdded().then(added => {
        appRepo.find().then(installed => {
          let res = [];
          added.forEach(plugin => {
            let finded = installed.filter(inst => {
              return inst.name === plugin.name;
            });
            if (finded.length > 0) {
              plugin.application = finded[0];
            }
            res.push(plugin);
          });
          resolve(res);
        }).catch(err => {
          reject(err);
        });
      });
    });
  }

  /**
   * get plugin manifest
   * @param {string} plugin name of plugin
   * @return {Promise} resolve plugin manifest instance
   */
  function getManifest(plugin) {
    return getStorageByPlugin(plugin).getManifest(plugin);
  }

  /**
   * activate all installed plugins
   * @return {Promise} resolve on plugins activated
   */
  function activatePlugins() {
    return new Promise((resolve, reject) => {
      appRepo.find({
        active: true
      }, "order ASC").then(plugins => {
        logger.trace("activatePlugins ", plugins);

        /**
         * run plugin activation
         * @param {number} i plugin index
         */
        function runActivation(i) {
          var plugin = plugins[i];
          if (plugin) {
            if (exists(plugin.name)) {
              activate(plugin.name, plugin.storage).then(() => {
                logger.info(i18n.__(i + 1, "/", plugins.length, ":", plugin.name, 'activated on boot'));
                runActivation(i + 1);
              }).catch(err => {
                logger.error(i18n.__('activate ', plugin.name, 'error:', err));
                runActivation(i + 1);
                // return reject(err);
              });
            } else {
              clearByPlugin(plugin.name).then(() => {
                logger.debug(i18n.__(plugin.name, 'does not exist and cleared'));
                runActivation(i + 1);
              });
            }
          } else {
            resolve();
          }
        }
        runActivation(0);
      });
    });
  }

  /**
   * download plugin by url
   * @param {string} url url for plugin
   * @param {EventEmitter} eventEmitter event emitter
   * @param {string} storage plugin storage name
   * @return {Promise} resolve on downloaded
   */
  function download(url, eventEmitter, storage) {
    return getStorage(storage).download(url, eventEmitter);
  }

  /**
   * remove plugin
   * @param {string} pluginName name of plugin
   * @return {Promise} resolve on plugin removed
   */
  function clearByPlugin(pluginName) {
    return new Promise((resolve, reject) => {
      if (!pluginName)
        return reject(i18n.__("Can't remove, no plugin name"));
      appRepo.findOne(pluginName).then(plugin => {
        if (plugin)
          appRepo.remove(pluginName).then(resolve).catch(reject);
        else
          resolve();
      });
    });
  }

  /**
   * check is plugin exist
   * @param {string} name plugin name
   * @return {boolean} true if plugin exist
   */
  function exists(name) {
    let exist = false;
    Object.keys(pluginsStorages).forEach(storage => {
      if (pluginsStorages[storage].exists(name))
        exist = true;
    });
    return exist;
  }

  /**
   * get plugin storage
   * @param {string} plugin name of plugin
   * @return {object} plugins storage instances
   */
  function getStorageByPlugin(plugin) {
    let ret;
    Object.keys(pluginsStorages).forEach(storage => {
      if (pluginsStorages[storage].existsFolder(plugin))
        ret = pluginsStorages[storage];
    });
    return ret;
  }

  /**
   * get help file
   * @param {string} plugin name of plugin
   * @return {string} help file content
   */
  function htmlHelpFile(plugin) {
    let storage = getStorageByPlugin(plugin);
    if (!storage)
      return;
    return path.resolve(storage.folder, plugin, "docs/build/index.html");
  }

  const checkChecksum = async function(storage, bucket, key, name, sourceFilePath, disableRemovePlugin) {
    try {
      let filePath = await storage.downloads3(bucket, `${key}.sha256`);
      logger.debug(i18n.__('validate checksum'), `${bucket}/${key} for plugin ${name}`);
      let content = fs.readFileSync(sourceFilePath);
      let pubkeyFilePath;
      try {
        let keyName = getPluginFileNameBySource(`${bucket}/${key}`);
        pubkeyFilePath = await storage.downloads3(bucket, `${getS3Url(keyName)}.pubkey`);
      } catch (err) {
        logger.debug(i18n.__('No pubkey, trying core pubkey'));
        logger.trace(err);
        pubkeyFilePath = 'server/certs/public.pem';
      }
      let pubkey = fs.readFileSync(path.resolve(pubkeyFilePath));
      pubkey = pubkey.toString().trim();
      let signature = fs.readFileSync(filePath).toString();
      let signature2 = signature.split('=');
      if (signature2.length != 2) {
        if (!disableRemovePlugin)
          storage.removePluginDir(name);
        logger.error(i18n.__('wrong signature file'));
        return Promise.reject(i18n.__('checksum not valid'));
      }
      signature2 = signature2[1].trim();
      let res = hashUtils.verify(content, pubkey, signature2);
      if (!res) {
        if (!disableRemovePlugin)
          storage.removePluginDir(name);
        return Promise.reject(i18n.__('checksum not valid'));
      }
      logger.debug(i18n.__('Valid checksum'));
      return Promise.resolve();
    } catch (err) {
      if (!disableRemovePlugin)
        storage.removePluginDir(name);
      logger.error(err);
      return Promise.reject(i18n.__('checksum not valid'));
    }
  };

  const getByUrl = async function(url, storage, name, skipChecksum, hotfix) {
    return new Promise((resolve, reject) => {
      logger.debug(i18n.__("add plugin by", url));
      if (url.indexOf('.git') > -1) {
        return addFromGit(url, storage)
          .then(resolve)
          .catch(reject);
      }
      if (url.indexOf('s3://') > -1) {
        let strg = getStorage(storage);
        let filePath;
        return strg
          .downloads3ByUrl(url)
          .then(filepath => {
            filePath = filepath;
            return strg.unpack(filepath, url, name);
          })
          .then(() => {
            if (!configService.get('checkPluginsChecksum') || skipChecksum)
              return Promise.resolve(name);
            return strg.getKeyAndBucketFromUrl(url).then(res => {
              let { bucket, key } = res;
              return checkChecksum(strg, bucket, key, name, filePath);
            });
          })
          .then(resolve)
          .catch(reject);
      }

      if (url.indexOf('.zip')) {
        return addFromArchive(url, storage)
          .then(resolve)
          .catch(reject);
      }

      return reject('Unknown plugin url type.');
    });
  };

  /**
   * add plugin by binary data
   * @param {string} content binary data
   * @param {string} fileName file name
   * @param {string} storageName plugins storage name
   * @return {Promise} resolve on added
   */
  function getByContent(content, fileName, storageName) {
    return new Promise((resolve, reject) => {
      if (!fileName) {
        return reject(i18n.__("fileName is required"));
      }
      logger.trace(i18n.__("add from content", fileName));
      let storage = getStorage(storageName);
      logger.trace(i18n.__("Start wait unlock"));
      return waitUnlock(storage).then(() => {
          logger.trace(i18n.__("UNLOCKED"));
          return lock(storage);
        }).then(() => {
          return storage.writeContent(content, fileName);
        }).then(filepath => {
          return storage.unpack(filepath, "file:" + fileName);
        }).then(resolve)
        .catch(err => {
          let pluginInfo = storage.getPluginNameByFile(fileName);
          storage.removePluginDir(pluginInfo.name);
          reject(err);
        }).then(() => {
          logger.trace(i18n.__("unlock"));
          return unlock(storage);
        });
    });
  }

  /**
   * add or update plugin by binary data
   * @param {string} content binary data
   * @param {string} fileName file name
   * @param {string} storageName plugins storage name
   * @return {Promise} resolve on added or updated
   */
  function getOrUpdateByContent(content, fileName, storageName) {
    return new Promise((resolve, reject) => {
      logger.debug(i18n.__("add or update from content", fileName));
      if (configService.get("containerStatus.immutable") && configService.get("containerStatus.state") === 'locked') {
        logger.debug(i18n.__("Immutable container locked to update"));
        return Promise.reject();
      }
      let storage = getStorage(storageName);
      let pluginNameInfo = storage.getPluginNameByFile(fileName);
      let pluginName = pluginNameInfo.name;
      let pluginApp;
      logger.debug('pluginName', pluginName);
      logger.trace(i18n.__("Start wait unlock"));
      waitUnlock(storage).then(() => {
        logger.trace(i18n.__("IS UNLOCKED"));
        return lock(storage, true);
      }).then(() => {
        return appRepo.findOne(pluginName);
      }).then(pl => {
        pluginApp = pl;
        if (!pluginApp) {
          logger.debug(i18n.__("Upload plugin: no installed plugin"));
          return resolve(true);
        }
        if (pluginApp.active) {
          logger.debug(i18n.__("Upload plugin", pluginName, ": deactivate"));
          return deactivate(pluginName, true);
        }
        return Promise.resolve();
      }).then(notFound => {
        logger.debug(i18n.__("Upload plugin", pluginName, ": uninstall"));
        if (notFound)
          return Promise.resolve();
        return uninstall(pluginName, true);
      }).then(() => {
        if (!storage.exists(pluginName)) {
          logger.debug('Upload plugin: plugin not exist');
          return Promise.resolve();
        }
        logger.debug(i18n.__("Upload plugin", pluginName, ": remove"));
        return remove(pluginName, true);
      }).catch(err => {
        logger.debug("can't remove plugin", err);
        return Promise.resolve();
      }).then(() => {
        return storage.writeContent(content, fileName);
      }).then(filepath => {
        return storage.unpack(filepath, "file:" + fileName);
      }).catch(err => {
        let pluginInfo = storage.getPluginNameByFile(fileName);
        storage.removePluginDir(pluginInfo.name);
        reject(err);
      }).then(() => {
        logger.debug(i18n.__("Upload plugin", pluginName, ": install"));
        return install(pluginName, pluginApp ? pluginApp.order : null);
      }).catch(err => {
        logger.error("Install error", err);
      }).then(() => {
        if (pluginApp && !pluginApp.active)
          return Promise.resolve();
        logger.debug(i18n.__("Upload plugin", pluginName, ": activate"));
        return activate(pluginName);
      }).then(() => {
        logger.info("Upload", pluginName, "finished");
        pluginsFeed.publishPluginOperation(pluginName, storage, pluginsFeed.MESSAGES.UPDATED);
        return resolve(true);
      }).catch(err => {
        let result = `${i18n.__("Upload plugin")} ${pluginName} error: ${err}`;
        return reject(result);
      }).then(() => {
        logger.trace(i18n.__('unlock'));
        return unlock(storage, true);
      });
    });
  }

  const getByKey = async function(bucket, key, storage, skipChecksum, name) {
    return new Promise(async(resolve, reject) => {
      logger.debug(i18n.__("add plugin from"), bucket, i18n.__("by key"), key);
      let strg = getStorage(storage);
      let filePath;
      logger.trace(i18n.__("Start wait unlock"));
      return waitUnlock(strg).then(() => {
          logger.trace(i18n.__("UNLOCKED"));
          return lock(strg);
        }).then(() => {
          return strg.downloads3(bucket, key);
        }).then(filepath => {
          filePath = filepath;
          return strg.unpack(filepath, "s3://" + bucket + "/" + key);
        }).then(pluginName => {
          if (!name)
            name = pluginName;
          if (!configService.get('checkPluginsChecksum') || skipChecksum)
            return Promise.resolve();
          return checkChecksum(strg, bucket, key, name, filePath);
        }).then(() => resolve(name)).catch(reject)
        .then(async() => {
          logger.trace(i18n.__("unlock"));
          return unlock(strg);
        });
    });
  };

  const getBucketByEnv = () => {
    let bucket = "ng-rt-public-production";

    if (process.env.BUILD_ID && process.env.BUILD_ID.indexOf("C") > -1)
      bucket = "ng-rt-consolidation";
    if (process.env.BUILD_ID && process.env.BUILD_ID.indexOf("D") > -1)
      bucket = "ng-rt-development";
    if (process.env.BUILD_ID && process.env.BUILD_ID.indexOf("CA") > -1)
      bucket = "ng-rt-production";
    if (process.env.BUILD_ID && process.env.BUILD_ID.indexOf("GA") > -1)
      bucket = "ng-rt-public-production";
    return bucket;
  };

  /**
   * get s3 bucket name by plugn source url
   * @param {string} source plugin source url
   * @return {string} s3 bucket name
   */
  function getBucketBySource(source) {
    let bucket = "ng-rt-development";
    if (source.indexOf("s3") > -1) {
      let parts = source.split("://");
      if (parts.length > 1) {
        parts = parts[1].split("/");
        bucket = parts[0];
      }
    }
    return bucket;
  }

  /**
   * get plugin url
   * @param {object} config plugin config
   * @return {string} plugin url
   */
  function getUrlByPrefixConfig(config) {
    let url = config.url;
    if (url && config.type && config.type === 's3') {
      if (config.prefix)
        url = config.prefix + url;
      else {
        url = `s3://${getBucketByEnv()}${config.url}`;
      }
    }
    return url;
  }

  /**
   * add plugin by config
   * @param {string} plug plugin name
   * @param {string} storage plugins storage name, main if not defined
   * @param {boolean} hotfix get hotfix update
   * @return {Promise} resolve on added
   */
  const getByConfig = (plug, storage, hotfix) => new Promise((resolve, reject) => {
    logger.info(i18n.__("add by config"), plug, "BUILD_ID=", process.env.BUILD_ID);
    let url = getUrlByPrefixConfig(plug);
    if (url)
      return getByUrl(url, storage, plug.name).then(resolve).catch(reject);
    let key;
    if (plug.key)
      key = plug.key;
    else {
      let type = plug.type ? plug.type : "zip";
      key = plug.name + "." + type;
    }
    let bucket = plug.bucket ? plug.bucket : getBucketByEnv();
    // PA1 = customer name
    // PA3 Internal || External
    if (process.env.LICENSE_PA1 && process.env.LICENSE_PA1 != 'n.a') {
      let newBucket = bucket;
      if (newBucket.indexOf('ng-rt-public') < 0 && process.env.LICENSE_PA3 != 'Internal')
        newBucket = newBucket.replace('ng-rt-', 'ng-rt-public-');
      newBucket = `${newBucket}-${process.env.LICENSE_PA1.toLowerCase()}`;
      if (hotfix && newBucket.indexOf('-hotfix') < 0)
        newBucket = `${newBucket}-hotfix`;
      return getMetadata(plug.name, `s3://${newBucket}/${getS3Url(key)}`, storage).then(meta => {
        return getByKey(newBucket, getS3Url(key), storage, plug.skipChecksum, plug.name).then(resolve).catch(reject);
      }).catch(error => {
        logger.debug(i18n.__('Plugin does not exist in project specific bucket :', newBucket));
        logger.debug(i18n.__('Trying to download from standard bucket : ', bucket));
        if (hotfix && bucket.indexOf('-hotfix') < 0)
          bucket = `${bucket}-hotfix`;
        return getByKey(bucket, getS3Url(key), storage, plug.skipChecksum, plug.name).then(resolve).catch(reject);
      });
    }
    if (hotfix && bucket.indexOf('-hotfix') < 0)
      bucket = `${bucket}-hotfix`;
    return getByKey(bucket, getS3Url(key), storage, plug.skipChecksum, plug.name).then(resolve).catch(reject);
  });

  /**
   * get s3 url
   * @param {string} key plugin archive name
   * @return {string} plugin s3 url
   */
  function getS3Url(key) {
    let urlTemplate = pluginS3UrlTemplate;
    urlTemplate = urlTemplate.replace('${CORE_VERSION}', process.env.CORE_VERSION);
    urlTemplate = urlTemplate.replace('${FILE_NAME}', key);
    return urlTemplate;
  }

  /**
   * get plugin name by source url
   * @param {string} source plugin source url
   * @return {string} plugin name
   */
  function getPluginFileNameBySource(source) {
    let fileName;
    let parts = source.split("/");
    if (parts) {
      fileName = parts[parts.length - 1];
      let parts2 = fileName.split('.');
      if (parts2.length > 1) {
        parts2.splice(-1, 1);
        fileName = parts2.join('.');
      }
    }
    return fileName;
  }

  /**
   * get metadata by config
   * @param  {string} pluginName - plugin name
   * @param  {object} config - configuration for plugin
   * @return {Promise} resolve plugin metadata
   */
  function getMetadataFromConfig(pluginName, config) {
    return new Promise((resolve, reject) => {
      let strg = getStorageByPlugin(pluginName);
      if (config.type && config.type != 's3')
        return config.url;
      let bucket = config.prefix;
      if (!bucket)
        bucket = getBucketByEnv();
      else if (bucket.indexOf('s3://') === 0) {
        bucket = bucket.substr(5);
      }
      let key;
      if (config.url) {
        if (config.url.indexOf('/') != 0)
          return getMetadata(pluginName, config.url, config.skipChecksum).then(resolve).catch(reject);
        key = config.url;
        let split1 = key.split('/');
        let fileName = split1[split1.length - 1];
        let split2 = fileName.split('.');
        split2.splice(-1, 1);
        split1.splice(-1, 1);
        key = `${split1.join('/')}/${split2.join('.')}.json`;
      } else
        key = getS3Url(`${config.name}.json`);
      if (key[0] === '/')
        key = key.substr(1);
      logger.debug(i18n.__("Get metadata by config"), bucket, key);
      let filePath;
      let metaData;
      return strg.downloads3(bucket, key).then(filepath => {
        filePath = filepath;
        if (config.skipChecksum)
          return Promise.resolve();
        return checkChecksum(strg, bucket, key, pluginName, filePath, true);
      }).then(() => {
        let metadata = fs.readFileSync(filePath, 'utf-8');
        metaData = JSON.parse(metadata);
        filePath = null;
        if (configService.get('skipHotfix'))
          return Promise.resolve();
        return strg.downloads3(`${bucket}-hotfix`, key);
      }).catch(() => {
        return Promise.resolve();
      }).then(filepath => {
        if (!filepath)
          return Promise.resolve();
        filePath = filepath;
        if (config.skipChecksum)
          return Promise.resolve();
        return checkChecksum(strg, `${bucket}-hotfix`, key, pluginName, filePath, true);
      }).then(() => {
        if (!filePath)
          return Promise.resolve(metaData);
        metaData.hotfix = JSON.parse(fs.readFileSync(filePath), 'utf-8');
        return Promise.resolve(metaData);
      }).then(resolve).catch(reject);
    });
  }

  /**
   * check plugin source url for hotfix and get original
   * @param {string} source url of plugin string
   * @return {string} url of origin plugin sourc
   */
  function checkAndClearSourceFromHotfix(source) {
    if (source.indexOf('s3://') === 0 && source.indexOf('-hotfix/') > -1) {
      let url = source.split('s3://')[1];
      let urls = url.split('/');
      if (urls.length > 0) {
        urls[0] = urls[0].replace('-hotfix', '');
      }
      source = `s3://${urls.join('/')}`;
    }
    return source;
  }

  /**
   * Get metadata file from s3 bucket.
   * @param  {string} plugin The plugin name
   * @param  {string} source The source of plugin
   * @param {boolean} skipChecksum skip checking checksum
   * @return {Promise} The promise which resolve metadata json
   */
  function getMetadata(plugin, source, skipChecksum) {
    return new Promise((resolve, reject) => {
      let strg = getStorageByPlugin(plugin);
      if (!strg)
        return reject("No plugin");
      if (source)
        source = checkAndClearSourceFromHotfix(source);
      let bucket = source ? getBucketBySource(source) : getBucketByEnv();
      let fileName = source ? getPluginFileNameBySource(source) : plugin;
      let key = getS3Url(`${fileName}.json`);
      logger.debug(i18n.__("Get metadata"), bucket, key);
      let filePath;
      let metaData;
      return strg.downloads3(bucket, key).then(filepath => {
        filePath = filepath;
        if (skipChecksum)
          return Promise.resolve();
        return checkChecksum(strg, bucket, key, plugin, filePath, true);
      }).then(() => {
        let metadata = fs.readFileSync(filePath, 'utf-8');
        metaData = JSON.parse(metadata);
        filePath = null;
        if (configService.get("skipHotfix"))
          return Promise.resolve();
        return strg.downloads3(`${bucket}-hotfix`, key);
      }).catch(() => {
        return Promise.resolve();
      }).then(filepath => {
        if (!filepath)
          return Promise.resolve();
        filePath = filepath;
        if (skipChecksum)
          return Promise.resolve();
        return checkChecksum(strg, `${bucket}-hotfix`, key, plugin, filePath, true);
      }).then(() => {
        if (!filePath)
          return Promise.resolve(metaData);
        metaData.hotfix = JSON.parse(fs.readFileSync(filePath), 'utf-8');
        return Promise.resolve(metaData);
      }).then(resolve).catch(reject);
    });
  }

  /**
   * compare plugin versions
   * @param {string} ver1 plugin old version
   * @param {string} ver2 plugin new version
   * @return {boolean} true if new version greater
   */
  function compareVersions(ver1, ver2) {
    let versions1 = ver1.trim().split('.');
    let versions2 = ver2.trim().split('.');
    let ret = false;
    for (let i = 0; i < versions2.length; i++) {
      // Skip week number comparison
      if (i === 2) {
        continue;
      }
      if (versions1[i] == 'undefined' || versions2[i] == 'undefined')
        break;
      if (Number(versions1[i]) < Number(versions2[i])) {
        break;
      }
      if (Number(versions1[i]) > Number(versions2[i])) {
        ret = true;
        break;
      }
    }
    return ret;
  }

  /**
   * check plugin has hotfix update
   * @param {objeect} metadata plugin metadata
   * @param {string} appVersion plugin version
   * @return {boolean} true if has hotfix update
   */
  function hasHotfix(metadata, appVersion) {
    return metadata.hotfix && compareVersions(metadata.hotfix.version, appVersion) || metadata.hotfix && compareVersions(metadata.hotfix.version, appVersion) || false;
  }

  /**
   * check plugin has updates
   * @param {string} pluginName plugin name
   * @param {objeect} config plugin config
   * @return {Promise} resolve object - result of check
   */
  function hasUpdates(pluginName, config) {
    return new Promise((resolve, reject) => {
      let appVersion = "";
      let strg = getStorageByPlugin(pluginName);
      let localVersion;
      let manifest;
      let manVersion;
      let coreVersion = process.env.CORE_VERSION;
      let useNewSource = false;
      if (coreVersion && coreVersion[coreVersion.length - 1] === '.')
        coreVersion = coreVersion.slice(0, -1);
      strg.getManifest(pluginName).then(man => {
        manifest = man;
        manVersion = manifest.version;
        if (manVersion[manVersion.length - 1] === '.')
          manVersion = manVersion.slice(0, -1);
        return strg.version(pluginName);
      }).then(lv => {
        if (manifest)
          localVersion = manifest.version + lv;
        return appRepo.findOne(pluginName);
      }).then(pluginApp => {
        if (pluginApp && pluginApp.source.indexOf('file:') === 0)
          return Promise.resolve({
            localInstalled: true
          });
        if (manVersion !== coreVersion) {
          useNewSource = true;
          if (config) return getMetadataFromConfig(pluginName, config);
          if (pluginApp)
            return getMetadata(pluginName, pluginApp.source);
          return getMetadata(pluginName);
        }
        if (!pluginApp)
          return Promise.resolve({});
        appVersion = pluginApp.version.trim();
        if (config)
          return getMetadataFromConfig(pluginName, config);
        return getMetadata(pluginName, pluginApp.source);
      }).then(metadata => {
        if (metadata.localInstalled)
          return resolve({
            has: false,
            localInstalled: true
          });
        if (metadata && metadata.version) {
          logger.debug(i18n.__("check versions"), metadata.version, appVersion, localVersion);
          let ret = compareVersions(metadata.version, appVersion) || compareVersions(appVersion, localVersion);
          let hotfix = hasHotfix(metadata, appVersion);
          logger.debug(i18n.__("Hotfix"), hotfix ? metadata.hotfix.version : i18n.__('no'));
          if (hotfix) {
            metadata = metadata.hotfix;
            useNewSource = true;
          }
          return resolve({
            has: ret || hotfix,
            hotfix,
            newVersion: metadata.version,
            reactivate: activatedPluginsVersions[pluginName] ? compareVersions(localVersion, activatedPluginsVersions[pluginName]) : false,
            useNewSource: useNewSource
          });
        }
        return resolve(false);
      }).catch(err => {
        logger.trace(i18n.__("Metadata error"), ":", err.message ? err.message : err);
        return reject(err);
      });
    });
  }

  /**
   * check plugin has license file
   * @param {string} plugin plugin name
   * @return {boolean} true if exist
   */
  function hasLicense(plugin) {
    return getStorageByPlugin(plugin).hasFile(plugin, 'license.txt');
  }

  /**
   * check plugin has instruction file
   * @param {string} plugin plugin name
   * @return {boolean} true if exist
   */
  function hasInstruction(plugin) {
    return getStorageByPlugin(plugin).hasFile(plugin, 'instruction.txt');
  }

  /**
   * get license content
   * @param {string} plugin plugin name
   * @return {Promise} resole file content
   */
  function getLicense(plugin) {
    return getStorageByPlugin(plugin).getFile(plugin, 'license.txt');
  }

  /**
   * get insruction content
   * @param {string} plugin plugin name
   * @return {Promise} resole file content
   */
  function getInstruction(plugin) {
    return getStorageByPlugin(plugin).getFile(plugin, 'instruction.txt');
  }

  /**
   * get lsit of storages
   * @return {Array} list of storagess
   */
  function storagesList() {
    return Object.keys(pluginsStorages).map(key => {
      return {
        id: pluginsStorages[key].id,
        title: pluginsStorages[key].title
      };
    });
  }

  /**
   * set plugin as application
   * @param {string} plugin plugin name
   * @param {boolean} asApp is plugin can bee used as application
   * @return {Promise} resolve on plugin record updated
   */
  function setAsApp(plugin, asApp) {
    return appRepo.setAsApp(plugin, asApp);
  }

  /**
   * set plugin as subscriptions
   * @param {string} plugin plugin name
   * @param {boolean} asSubscription is plugin can bee used as application
   * @return {Promise} resolve on plugin record updated
   */
  function setAsSubscription(plugin, asSubscription) {
    return appRepo.setAsSubscription(plugin, asSubscription);
  }

  /**
   * wait until storage be unlocked
   * @param {string|object} storage name of storage or storage instance
   * @return {Promise} resolve on unlocked
   */
  function waitUnlock(storage) {
    return new Promise((resolve, reject) => {
      // logger.debug(i18n.__("wait unlock");
      checkLock(storage).then(isLocked => {
        if (isLocked) {
          setTimeout(() => {
            waitUnlock().then(resolve);
          }, 1000);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Update plugin
   * @param {string} pluginName name of plugin
   * @param {boolean} useNewSource use new source if true
   * @param {object} config plugin configuration object
   * @param {boolean} hotfix update from hotfix
   * @param {boolean} skipPublish skip plugin feed
   * @return {Promise} resolve on updated
   */
  function updatePlugin(pluginName, useNewSource, config, hotfix, skipPublish) {
    return new Promise((resolve, reject) => {
      logger.info(i18n.__("Start update"), pluginName, i18n.__("plugin"));
      // rabbitMQ.publishFanout(MESSAGES.UPDATE, pluginName);
      if (configService.get('containerStatus.immutable') && configService.get("containerStatus.state") === 'locked') {
        logger.debug(i18n.__('Immutable container locked to update'));
        return reject();
      }
      let pluginApp;
      let storage = getStorageByPlugin(pluginName);
      logger.trace(i18n.__("Start wait unlock"));
      waitUnlock(storage).then(() => {
        logger.trace(i18n.__("IS UNLOCKED"));
        return lock(storage, true);
      }).then(() => {
        return appRepo.findOne(pluginName);
      }).then(pl => {
        pluginApp = pl;
        if (!pluginApp)
          return reject("Can't find plugin record");
        if (!pluginApp.source || !pluginApp.storage) {
          reject("Can't update no source or storage");
          return;
        }
        if (pluginApp.active) {
          logger.debug(i18n.__("Update plugin"), pluginName, ": ", i18n.__("deactivate"));
          return deactivate(pluginName, true);
        }
        return Promise.resolve();
      }).then(() => {
        logger.debug(i18n.__("Update plugin"), pluginName, ": ", i18n.__("uninstall"));
        return uninstall(pluginName, true);
      }).then(() => {
        logger.debug(i18n.__("Update plugin"), pluginName, ": ", i18n.__("remove"));
        return remove(pluginName, true);
      }).catch(err => {
        logger.debug(i18n.__("can't remove plugin", err));
        return Promise.resolve();
      }).then(() => {
        logger.debug(i18n.__("Update plugin"), pluginName, ": ", i18n.__("add by url"), pluginApp.source, i18n.__("to"), pluginApp.storage, i18n.__("storage"));
        if (useNewSource)
          return getByConfig(config, pluginApp.storage, hotfix);
        let source = pluginApp.source;
        if (!hotfix && source)
          source = checkAndClearSourceFromHotfix(source);
        if (hotfix && source.indexOf('s3://') === 0) {
          let url = source.split('s3://')[1];
          let urls = url.split('/');
          if (urls.length > 0) {
            urls[0] = `${urls[0]}-hotfix`;
          }
          source = `s3://${urls.join('/')}`;
        }

        return getByUrl(source, pluginApp.storage, pluginName, false);
      }).then(() => {
        logger.debug(i18n.__("Update plugin"), pluginName, ": ", i18n.__("install"));
        return install(pluginName, pluginApp.order);
      }).catch(err => {
        logger.error(i18n.__("Install error"), err);
      }).then(() => {
        if (!pluginApp.active)
          return Promise.resolve();
        logger.debug(i18n.__("Update plugin"), pluginName, ": ", i18n.__("activate"));
        return activate(pluginName);
      }).then(() => {
        logger.info(i18n.__("Update"), pluginName, i18n.__("finished"));
        if (skipPublish)
          return resolve(true);
        pluginsFeed.publishPluginOperation(pluginName, storage, pluginsFeed.MESSAGES.UPDATED);
        return resolve(true);
      }).catch(err => {
        return reject(i18n.__("Update plugin"), pluginName, i18n.__("error:"), err && err.message ? err.message : err);
      }).then(() => {
        return unlock(storage, true);
      });
    });
  }

  /**
   * activate plugin (before activate will deactivate if already activated)
   * @param {string} pluginName name of plugin
   * @return {Promise} resolve on activated
   */
  function reactivate(pluginName) {
    return new Promise((resolve, reject) => {
      logger.debug(i18n.__("Reactivate", pluginName));
      appRepo.findOne(pluginName).then(pluginApp => {
        if (!pluginApp)
          return reject("No plugin record in db");
        if (!pluginApp.active)
          return resolve();
        return deactivate(pluginName);
      }).then(() => {
        return activate(pluginName);
      }).then(resolve).catch(reject);
    });
  }

  /**
   * lock storage
   * @param {string|object} storage plugins storage instnace or his name
   * @param {boolean} isMain true if storage is main
   * @return {Promise} resolve on locked
   */
  function lock(storage, isMain) {
    if (!storage || typeof storage === "string")
      storage = getStorage(storage);
    return storage.lock(isMain);
  }

  /**
   * unlock storage
   * @param {string|object} storage plugins storage instnace or his name
   * @param {boolean} isMain true if storage is main
   * @return {Promise} resolve on unlocked
   */
  function unlock(storage, isMain) {
    if (!storage || typeof storage === "string")
      storage = getStorage(storage);
    return storage.unlock(isMain);
  }

  /**
   * check storage is locked
   * @param {string|object} storage plugins storage instnace or his name
   * @param {boolean} isMain true if storage is main
   * @return {Promise.<boolean>} resolve true if locked
   */
  function checkLock(storage, isMain) {
    if (!storage || typeof storage === "string")
      storage = getStorage(storage);
    return storage.checkLock(isMain);
  }

  /**
   * list available buckets
   * @param {string|object} storage plugins storage instnace or his name
   * @return {Promise.<Array>} list of plugins
   */
  function listBuckets(storage) {
    if (!storage || typeof storage === "string")
      storage = getStorage(storage);
    return storage.listBuckets();
  }

  /**
   * get list of objects in bucket
   * @param {string} bucketName s3 bucket name
   * @param {string} prefix prefix for objects
   * @param {*} storage plugins storage instnace or his name
   * @return {Promise.<Array>} resolve list of object in bucket
   */
  function listBucketObjects(bucketName, prefix, storage) {
    if (!storage || typeof storage === "string")
      storage = getStorage(storage);
    return storage.listBucketObjects(bucketName, prefix);
  }

  /**
   * check is plugin installed
   * @param  {string} name - plugin name
   * @return {Promise} resolve true if installed
   */
  function isInstalled(name) {
    return new Promise((resolve, reject) => {
      appRepo.find({ name: name }).then(founded => {
        if (founded && founded.length > 0)
          return resolve(true);
        resolve(false);
      });
    });
  }

  /**
   * get plugin reecord
   * @param {string} name of plugin
   * @return {Promise} resolve plugin record from db
   */
  function getPlugin(name) {
    return appRepo.findOne(name);
  }

  /**
   * deactivate plugins on application stop
   * @return {Promise} resolve on finish
   */
  async function deactivateOnExit() {
    let plugins = await getPlugins();
    return plugins.reduce((promises, p) => {
      return promises.then(async() => {
        let manifest = await getManifest(p.name);
        if (manifest.deactivateOnExit) {
          await deactivate(p.name);
          return Promise.resolve();
        }
        return Promise.resolve();
      });
    }, Promise.resolve());
  }

  pluginsFeed = require('./pluginsFeed')(services, {
    getStorage,
    install,
    uninstall,
    deactivate,
    activate,
    remove,
    updatePlugin,
    appRepo,
    compareVersions,
    hasUpdates,
    getPlugin
  });

  return {
    install: install,
    uninstall: uninstall,
    activate: activate,
    deactivate: deactivate,
    remove: remove,
    update: updatePlugin,
    add_from_archive: addFromArchive,
    add_from_git: addFromGit,
    getByContent: getByContent,
    getOrUpdateByContent: getOrUpdateByContent,
    get_added: getAdded,
    publish: pluginsFeed.publishPlugin,
    get_plugins: getPlugins,
    get_manifest: getManifest,
    activate_plugins: activatePlugins,
    services: services,
    activate_all: activateAll,
    download: download,
    exists: exists,
    clear_plugin: clearByPlugin,
    add_by_url: getByUrl,
    add_by_key: getByKey,
    add_by_config: getByConfig,
    events: eventEmitter,
    hasLicense: hasLicense,
    getLicense: getLicense,
    hasInstruction: hasInstruction,
    getInstruction: getInstruction,
    configs: configurationManager,
    mainStorage: getStorage,
    storages: storagesList,
    htmlHelpFile: htmlHelpFile,
    setAsApp: setAsApp,
    setAsSubscription: setAsSubscription,
    getMetadata: getMetadata,
    hasUpdates: hasUpdates,
    lock: lock,
    unlock: unlock,
    checkLock: checkLock,
    reactivate: reactivate,
    subscribeToUpdates: pluginsFeed.subscribe,
    checkDependencies: checkDependencies,
    listBuckets: listBuckets,
    listBucketObjects: listBucketObjects,
    validateChecksum: checkChecksum,
    getBucketByEnv: getBucketByEnv,
    getS3Url: getS3Url,
    getStorage: getStorage,
    runAction: runAction,
    isInstalled: isInstalled,
    getPlugin: getPlugin,
    initDb
  };
}

module.exports = PluginManager;