/**
 * Implementation of plugin_manager service
 */
'use strict';
const PluginManager = require('../../pluginManager/manager');
const logger = require('log4js').getLogger('pluginManager');
const _ = require('lodash');
module.exports = async (app, configService, services, pluginManagerEventsReady) => {
  logger.debug('executing plugin_manager');
  let autoUpdateConfig = configService.get("autoUpdate");
  const isImmutable = configService.get('containerStatus.immutable');
  const i18n = services.get('i18n');
  var manager;
  let errorSummary = '';
  let bootstrapErrors = 0;
  let projectErrors = 0;
  let customErrors = 0;
  const metricsClient = services.get('metricsClient');

  try {
    // var configService = require('./config_service');
    manager = new PluginManager(app, configService, services);
    await manager.initDb();
  } catch (ex) {
    logger.error('Error initializing plugin manager', ex);
  }
  app.plugin_manager = manager;
  if (pluginManagerEventsReady && typeof pluginManagerEventsReady)
    pluginManagerEventsReady(manager.events);

  // let pluginsFeedConfig = configService.get('pluginsFeed');
  // // Enable plugins feed
  // if (pluginsFeedConfig && pluginsFeedConfig.enabled)
  //   require("../../pluginManager/pluginsFeed")(app, configService, manager.mainStorage());

  logger.trace(i18n.__('api services attached'), app.plugin_manager.services);
  let bootstrappingPlugins = configService.get('bootstrappingPlugins');
  let plugins = configService.get('plugins');
  let workedArrays = bootstrappingPlugins.concat(plugins);
  let customPlugins = configService.get('additionalPluginsStorages');
  let bootstrapPluginNames = _.map(bootstrappingPlugins, 'name');
  let projectPluginNames = _.map(plugins, 'name');
  // let customPluginNames = _.map(customPlugins, 'name');

  // Listener appends plugin install errors to a variable
  manager.events.on('ERROR_PLUGIN_INSTALL', (pluginName, err) => {
    errorSummary = errorSummary + i18n.__('Plugin %s was not installed successfully. Error: %s', pluginName, err && err.message ? err.message : err) + "\n";
    if (bootstrapPluginNames.includes(pluginName)) {
      bootstrapErrors++;
      metricsClient.increment(`pluginManager, pluginName = ${pluginName},  error = ${err}, type = 'bootstrapping'`);
    } else if (projectPluginNames.includes(pluginName)) {
      projectErrors++;
      metricsClient.increment(`pluginManager, pluginName = ${pluginName},  error = ${err}, type = 'project'`);
    } else {
      customErrors++;
      metricsClient.increment(`pluginManager, pluginName = ${pluginName},  error = ${err}, type = 'custom'`);
    }
  });

  // listener called once all plugins have installed, including custom, if present
  manager.events.on('PLUGIN_INSTALLATION_FINISHED', () => {
    if (bootstrapErrors)
      logger.error(i18n.__('0020 : Number of errors faced while installing Bootstrap plugins = %s', bootstrapErrors));
    else
      logger.info(i18n.__('0020 : Number of errors faced while installing Bootstrap plugins = %s', bootstrapErrors));

    if (projectErrors)
      logger.error(i18n.__('0021 : Number of errors faced while installing Project plugins = %s', projectErrors));
    else
      logger.info(i18n.__('0021 : Number of errors faced while installing Project plugins = %s', projectErrors));

    if (customErrors)
      logger.error(i18n.__('0022 : Number of errors faced while installing Custom plugins = %s', customErrors));
    else
      logger.info(i18n.__('0022 : Number of errors faced while installing Custom plugins = %s', customErrors));

    if (errorSummary) {
      logger.error(i18n.__('0023 : The short summary of the errors : %s', errorSummary));
    }
  });
  logger.trace("check and wait unlock");
  await waitUnlock().then(() => {
    logger.trace("UNLOCKED");
    return manager.lock(null, true);
  }).then(() => {
    logger.trace("LOCKED");
    return installPlugins(bootstrappingPlugins, 0);
  }).then(message => {
    logger.debug(i18n.__('Mandatory plugins installed'));
    manager.events.emit('MANDATORY_PLUGINS_INSTALLED');
    manager.mandatoryReady = true;
    if (manager.events)
      manager.events.emit('mandatory_ready');
    return installPlugins(plugins, 0);
  }).catch(err => {
    manager.events.emit('ERROR_MANDATORY_PLUGINS_INSTALL');
    logger.error(i18n.__('install mandatory plugins error'), err);
  }).then(message => {
    logger.info(i18n.__('All plugins installed'));
    manager.events.emit('ALL_PLUGINS_INSTALLED');
    manager.ready = true;
    if (manager.events)
      manager.events.emit('ready');

    // let data = manager.configs.data("ng-rt-admin");
    // logger.debug("absolute", data.path.absolute, "relative", data.path.relative);
    for (var key in customPlugins) {
      if (customPlugins.hasOwnProperty(key)) {
        var cPlug = customPlugins[key];
        if (cPlug.plugins && cPlug.plugins.length > 0) {
          workedArrays = workedArrays.concat(cPlug.plugins);
          installCustomPlugins(cPlug.plugins, 0, key);
        }
      }
    }
    manager.get_plugins().then(allPlugins => {
      let otherPlugns = allPlugins.filter(p => {
        let finded = workedArrays.find(pp => pp.name === p.name);
        return !finded;
      });
      otherPlugns.forEach(async op => {
        if (op.application && op.application.active)
          manager.activate(op.application.name).then(() => {
            logger.info(i18n.__('Plugin'), op.name, i18n.__('activated'));
          });
        if (isImmutable && !op.application) {
          await manager.install(op.name).then(() => {
            return manager.activate(op.name);
          });
        }
      });
    });
  }).catch(err => {
    manager.events.emit('ERROR_PLUGINS_INSTALL');
    logger.error(i18n.__('install plugins error'), err);
  }).then(() => {
    logger.debug("unlock");
    manager.unlock(null, true);
    manager.subscribeToUpdates().then(subscribed => {
      if (subscribed)
        logger.debug(i18n.__("Subscribed to plugins updates"));
    });
  }).then(() => {
    // an event to emit that installation of plugins is complete
    manager.events.emit('PLUGIN_INSTALLATION_FINISHED');
  });

  /**
   *
   * @param {*} storage Storage
   * @return {*} promise Returns a promise
   */
  function waitUnlock(storage) {
    return new Promise((resolve, reject) => {
      manager.checkLock(storage, true).then(isLocked => {
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
   *
   * @param {*} plugin Name of the plugin
   * @return {*} promise Returns a promise
   */
  function checkUpdates(plugin) {
    return new Promise((resolve, reject) => {
      let pluginName = plugin.name;
      logger.debug(i18n.__("Check updates"), plugin.name);
      if (!autoUpdateConfig || !autoUpdateConfig.active) {
        logger.trace(i18n.__("Auto update disabled"), autoUpdateConfig);
        return resolve();
      }
      if (autoUpdateConfig.excludePlugins && autoUpdateConfig.excludePlugins.some(ex => {
        return ex.name === pluginName;
      })) {
        logger.debug(i18n.__("Excluded from update"));
        return resolve();
      }
      manager.hasUpdates(pluginName, plugin).then(result => {
        logger.debug(i18n.__("Has updates"), result);
        if (result.has) {
          if (result.useNewSource) {
            return manager.update(pluginName, true, plugin, result.hotfix);
          }
          return manager.update(pluginName, false, plugin, result.hotfix);
        }
        if (result.localInstalled) {
          logger.warn(i18n.__("Localy installed plugin, can not be updated."));
        }
        return Promise.resolve();
      }).then(updated => {
        logger.debug(i18n.__("Lifecycle Management for "), pluginName, i18n.__("executed"));
        return resolve(updated);
      }).catch(err => {
        if (err)
          logger.error(i18n.__("Error on auto update"), pluginName, err.message ? err.message : err);
        return resolve();
      });
    });
  }

  /**
   *
   * @param {*} plugins Name of the Plugins
   * @param {*} i I
   * @return {*} promise Returns a promise
   */
  function installPlugins(plugins, i) {
    return new Promise((resolve, reject) => {
      if (!plugins)
        return resolve(i18n.__("No plugins"));
      if (i >= plugins.length) {
        return resolve(i18n.__('all plugins installed'));
      }
      var plug = plugins[i];
      logger.trace(i18n.__('install plugin'), plug.name, i18n.__('by'), plug.url);
      if (manager.exists(plug.name)) {
        logger.info(i + 1, '/', plugins.length, i18n.__('plugin'), plug.name, i18n.__('is already installed'));
        return checkUpdates(plug).then(updated => {
          if (!updated) {
            return manager.isInstalled(plug.name).then(installed => {
              if (installed || !isImmutable)
                return Promise.resolve();
              return manager.install(plug.name);
            }).then(() => {
              return manager.activate(plug.name);
            });
          }
          return Promise.resolve();
        }).catch(err => {
          logger.error(i18n.__('error while installing plugin %s / %s. Plugin %s %s', i + 1, plugins.length, plug.name, err && err.message ? err.message : err));
          manager.events.emit('ERROR_PLUGIN_INSTALL', plug.name, err);
        }).then(() => {
          return installPlugins(plugins, i + 1).then(resolve).catch(reject);
        });
      }
      var pluginName = plug ? plug.name : 'unknown';
      logger.debug(i18n.__(i + 1, '/', plugins.length, i18n.__("plugin doesn't exist. Install...")));
      manager.add_by_config(plug).then(plugin => {
        if (plugin)
          pluginName = plugin;
        return manager.clear_plugin(pluginName);
      }).then(() => {
        return manager.install(pluginName);
      }).then(() => {
        return manager.activate(pluginName);
      }).then(() => {
        logger.info(i + 1, '/', plugins.length, 'plugin', plug.name, 'installed and activated');
        return installPlugins(plugins, i + 1).then(resolve, reject);
      }).catch(err => {
        logger.error(i18n.__('error while installing plugin %s / %s. Plugin %s %s', i + 1, plugins.length, pluginName, err && err.message ? err.message : err));
        manager.events.emit('ERROR_PLUGIN_INSTALL', pluginName, err);
        return installPlugins(plugins, i + 1).then(resolve, reject);
      });
    });
  }

  /**
   *
   * @param {*} plugins plugins
   * @param {*} i I
   * @param {*} storage storage
   * @return {*} promise Returns a promise
   */
  function installCustomPlugins(plugins, i, storage) {
    return new Promise((resolve, reject) => {
      if (!plugins)
        return resolve(i18n.__("No plugins"));
      if (i >= plugins.length) {
        return resolve(i18n.__('all plugins installed'));
      }
      var plug = plugins[i];
      logger.trace(i18n.__('install plugin'), plug.name);
      if (manager.exists(plug.name)) {
        logger.debug(i + 1, '/', plugins.length, i18n.__('plugin'), plug.name, i18n.__('exist'));
        return checkUpdates(plug).then(updated => {
          if (!updated) {
            return new Promise((res, rej) => {
              return manager.isInstalled(plug.name);
            }).then(installed => {
              if (installed || !isImmutable)
                return Promise.resolve();
              return manager.install(plug.name);
            }).then(() => {
              return manager.activate(plug.name);
            });
          }
          return Promise.resolve();
        }).catch(err => {
          logger.error(err);
        }).then(() => {
          return installCustomPlugins(plugins, i + 1, storage).then(resolve).catch(reject);
        });
      }
      var pluginName;
      manager.add_by_config(plug, storage).then(plugin => {
        pluginName = plugin;
        return manager.clear_plugin(pluginName);
      }).then(() => {
        return manager.install(pluginName);
      }).then(() => {
        return manager.activate(pluginName);
      }).then(() => {
        logger.info(i + 1, '/', plugins.length, i18n.__('plugin'), plug.name, i18n.__('installed and activated by'), plug.url);
        return installCustomPlugins(plugins, i + 1, storage).then(resolve, reject);
      }).catch(err => {
        logger.error(i18n.__('error while installing plugin %s / %s. Plugin %s %s', i + 1, plugins.length, pluginName, err));
        manager.events.emit('ERROR_PLUGIN_INSTALL', pluginName, err);
        return installCustomPlugins(plugins, i + 1, storage).then(resolve, reject);
      }).then(resolve);
    });
  }
  // require('../socket/plugins')(app.socket_manager, app.plugin_manager);
};
