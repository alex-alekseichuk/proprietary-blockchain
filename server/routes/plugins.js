"use strict";
const logger = require('log4js').getLogger('plugins.route');
const fs = require("fs");
const path = require('path');
const serviceManager = require('../services');

/**
 * API/Route/plugins/
 *
 * @module API/Route/plugins
 * @type {Class}
 */

module.exports = server => {
  const initialConfigService = serviceManager.get('initialConfigService');
  const i18n = serviceManager.get('i18n');
  const namespace = initialConfigService.get('namespace') ? initialConfigService.get('namespace') : "ng-rt-core";

  const middlewareImmutable = (req, res, next) => {
    const isImmutable = serviceManager.get('configService').get('containerStatus.immutable');
    const isLocked = serviceManager.get('configService').get('containerStatus.state') === 'locked';
    if (isImmutable && isLocked) {
      res.status(500).send({ message: i18n.__('Immutable configuration, action denied') });
      res.end();
      return;
    }
    next();
  };

  const pluginManagerUploadCLIMiddleware = (req, res, next) => {
    const denied = serviceManager.get('configService').get("containerStatus.immutable") === true && serviceManager.get('configService').get("pluginManagerUploadCLI") === false;
    if (denied) {
      res.status(500).send({ message: i18n.__("Action by CLI denied") });
      return;
    }
    next();
  };

  const pluginManagerUploadUIMiddleware = (req, res, next) => {
    const denied = serviceManager.get('configService').get("containerStatus.immutable") === true && serviceManager.get('configService').get("containerStatus.pluginManagerUploadUI") === false;
    if (denied) {
      res.status(500).send({ message: i18n.__("Action by UI denied") });
      return;
    }
    next();
  };

  /**
   * Retrieve list of plugins
   *
   *  it : https://gitlab.project.com/qa/it/raw/dev/3.0/tests/integration/ng-rt-core/routes_plugin_test.js
   *
   * @name Retrieve list of plugins
   * @route {GET} /${namespace}/plugins
   * @authentication Requires valid session token
   */
  server.get(`/${namespace}/plugins`, server.ensureLoggedIn(), (req, res) => {
    let pluginsManager = server.plugin_manager;
    pluginsManager.get_plugins().then(plugins => {
      res.status(200).json(plugins);
    }).catch(err => {
      logger.error(err);
      res.status(500).json(err);
    }).then(() => {
      res.end();
    });
  });

  /**
   * Retrieve list of storages
   *
   *  it : https://gitlab.project.com/qa/it/raw/dev/3.0/tests/integration/ng-rt-core/routes_plugin_test.js
   *
   * @name Retrieve list of storages
   * @route {GET} /${namespace}/storages
   * @authentication Requires valid session token
   */
  server.get(`/${namespace}/storages`, server.ensureLoggedIn(), (req, res) => {
    let pluginsManager = server.plugin_manager;
    let storages = pluginsManager.storages();
    res.status(200).json(storages).end();
  });

  /**
   * Retrieve list of docs
2   * @name Retrieve list of docs
   * @route {GET} /${namespace}/plugins/docs
   * @queryparam {String} folder Folder to scan for docs
   * @authentication Requires valid session token
   */
  server.get(`/${namespace}/plugins/docs`, server.ensureLoggedIn(), (req, res) => {
    let docsPath = path.join(__dirname, `../../config/docs/${req.query.folder}`);
    let subdirs = [];
    logger.debug('executing /plugins/docs');
    logger.trace('req.query.folder :', req.query.folder);

    fs.readdir(docsPath, (err, dirs) => {
      if (err) return res.status(500).json(err).end();
      dirs.forEach(dir => {
        if (fs.lstatSync(`${docsPath}/${dir}`).isDirectory()) {
          subdirs.push(dir);
        }
      });

      res.status(200).json(subdirs).end();
    });
  });

  /**
   * Handler for uploading plugins
   * @param {Object} req - request instance
   * @param {Object} res - response instance
   */
  const zipurlUpload = (req, res) => {
    let pluginsManager = server.plugin_manager;
    let zipUrl = req.body.url;
    let storage = req.body.storage;
    logger.debug("upload plugin url", req.body.url);
    logger.trace("upload plugin", req.body);
    let checkMethod = () => {
      if (req.body.fileContent)
        return pluginsManager.getByContent(req.body.fileContent, zipUrl, storage);
      return pluginsManager.add_by_url(zipUrl, storage);
    };
    checkMethod().then(result => {
      logger.trace("Plugin added");
      return pluginsManager.get_plugins();
    }).then(pluginsList => {
      // socket.emit("upload_result", true);
      // socket.emit("plugins_list", pluginsList);
      res.status(200);
    }).catch(err => {
      // logger.error(err);
      res.status(500).json(err);
    }).then(() => {
      res.end();
    });
  };

  /**
   * Handler for uploading plugins
   * @param {Object} req - request instance
   * @param {Object} res - response instance
   */
  const zipurlUploadAndUpload = (req, res) => {
    let pluginsManager = server.plugin_manager;
    let zipUrl = req.body.url;
    let storage = req.body.storage;
    logger.debug("upload plugin url", req.body.url);
    logger.trace("upload plugin", req.body);
    let checkMethod = () => {
      if (req.body.fileContent)
        return pluginsManager.getOrUpdateByContent(req.body.fileContent, zipUrl, storage);
      return pluginsManager.add_by_url(zipUrl, storage);
    };
    checkMethod().then(result => {
      logger.trace("Plugin added");
      return pluginsManager.get_plugins();
    }).then(pluginsList => {
      // socket.emit("upload_result", true);
      // socket.emit("plugins_list", pluginsList);
      res.status(200);
    }).catch(err => {
      logger.error(err);
      res.status(500).json(err);
    }).then(() => {
      res.end();
    });
  };

  /**
   * Upload plugin by url of zip file
   *
   * @name Upload plugin by url of zip file
   * @route {POST} /${namespace}/plugins/zipurl
   * @bodyparam {String} url Url of zip file
   * @bodyparam {String} storage Storage type
   * @bodyparam {String} fileContent File content
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/zipurl`, server.ensureUserRoles(["admin"]), middlewareImmutable, pluginManagerUploadUIMiddleware, zipurlUpload);

  /**
   * Upload plugin by url of zip file, for application
   *
   * @name Upload plugin by url of zip file, for application
   * @route {POST} /${namespace}/plugins/app/zipurl
   * @bodyparam {String} url Url of zip file
   * @bodyparam {String} storage Storage type
   * @bodyparam {String} fileContent File content
   * @authentication Requires valid application jwt token
   */
  server.post(`/${namespace}/plugins/app/zipurl`, server.ensureApplicationByRoles('ng-rt-admin', ['admin']), middlewareImmutable, pluginManagerUploadCLIMiddleware, zipurlUploadAndUpload);

  /**
   * Upload plugin and refresh
   *
   * @name Upload plugin and refresh
   * @route {POST} /${namespace}/plugins/app/zipurl
   * @bodyparam {String} url Url of zip file
   * @bodyparam {String} storage Storage type
   * @bodyparam {String} fileContent File content
   * @authentication Requires valid application jwt token
   */
  server.post(`/${namespace}/plugins/reload`, server.ensureUserRoles(["admin"]), middlewareImmutable, pluginManagerUploadUIMiddleware, zipurlUploadAndUpload);

  const installOperations = {
    license: 0,
    instruction: 1,
    permissions: 2,
    settings: 3,
    install: 4
  };

  const installPluginsHandler = (req, res) => {
    let pluginsManager = server.plugin_manager;
    let params = req.body;
    let pluginName = params.pluginName;
    let storage = params.storage;
    let lastOperation = params.lastOperation;
    logger.debug("install", pluginName, "storage", storage);
    if (lastOperation < installOperations.license && pluginsManager.hasLicense(pluginName)) {
      return pluginsManager.getLicense(pluginName, storage).then(license => {
        res.status(200).json({
          operation: 'license',
          data: license
        }).end();
      }).catch(err => {
        res.status(500).json({
          isError: true,
          operation: 'license',
          data: err
        }).end();
      });
    }

    if (lastOperation < installOperations.instruction && pluginsManager.hasInstruction(pluginName)) {
      return pluginsManager.getInstruction(pluginName, storage).then(instruction => {
        res.status(200).json({
          operation: 'instruction',
          data: instruction
        }).end();
      }).catch(err => {
        res.status(500).json({
          isError: true,
          operation: 'license',
          data: err
        }).end();
        // socket.emit("status_error", err);
      });
    }

    pluginsManager.get_manifest(pluginName, storage).then(manifest => {
      if (lastOperation < installOperations.permissions && manifest.apiServices && manifest.apiServices.length > 0) {
        return res.status(200).json({
          operation: "permissions",
          data: manifest.apiServices
        }).end();
      }

      if (lastOperation < installOperations.settings && manifest.settings && manifest.settings.length > 0) {
        var pluginConfigs = pluginsManager.configs.get(pluginName);
        if (pluginConfigs) {
          manifest.settings.forEach(sett => {
            var val = pluginConfigs.get(sett.name);
            if (val) {
              sett.value = val;
            }
          });
        }
        return res.status(200).json({
          operation: "settings",
          data: manifest.settings
        }).end();
      }

      // socket.emit("install_start", "Install " + pluginName);
      let publishToFeed = req.body.publishToFeed === true;
      pluginsManager.install(pluginName, undefined, { exceptionByDependencies: true }, publishToFeed).then(result => {
        return res.status(200).json({
          operation: "installed",
          data: "ok"
        }).end();
      }).catch(error => {
        res.status(500).json({
          isError: true,
          operation: 'install',
          data: error
        }).end();
        // socket.emit("status_error", error);
      });
    });
  };

  /**
   * Install plugin
   *
   * @name Install plugin
   * @route {GET} /${namespace}/plugins/install
   * @bodyparam {String} pluginName Name of plugin
   * @bodyparam {String} storage Storage type
   * @bodyparam {String} lastOperation Last operation
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/install`, server.ensureUserRoles(["admin"]), middlewareImmutable, pluginManagerUploadUIMiddleware, installPluginsHandler);

  /**
   * Install plugin for applications
   *
   * @name Install plugin
   * @route {POST} /${namespace}/plugins/app/install
   * @bodyparam {String} pluginName Name of plugin
   * @bodyparam {String} storage Storage type
   * @bodyparam {String} lastOperation Last operation
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/app/install`, server.ensureApplicationByRoles('ng-rt-admin', ['admin']), middlewareImmutable, pluginManagerUploadCLIMiddleware, installPluginsHandler);

  const acceptSettingsHandler = async(req, res) => {
    let pluginsManager = server.plugin_manager;
    let params = req.body;
    let plugin = params.plugin;
    let settings = params.settings;
    try {
      var pluginConfigs = await pluginsManager.configs.getWithAdd(plugin);
      if (settings) {
        for (const sett of settings) {
          await pluginConfigs.set(sett.name, sett.value);
        }
      }
      pluginConfigs.save(err => {
        if (err) {
          logger.error(err);
          // socket.emit("status_error", err);
          return res.status(500).json(err).end();
        }
        res.status(200).end();
      });
    } catch (e) {
      logger.error(e);
      // socket.emit("status_error", e);
      res.status(500).json(e).end();
    }
  };

  /**
   * Accept settings for plugin
   *
   * @name Accept settings for plugin
   * @route {POST} /${namespace}/plugins/acceptsettings
   * @bodyparam {String} plugin Name of plugin
   * @bodyparam {Object} settings Settings
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/acceptsettings`, server.ensureUserRoles(["admin"]), middlewareImmutable, pluginManagerUploadUIMiddleware, acceptSettingsHandler);

  /**
   * Accept settings for plugin for applications
   *
   * @name Accept settings for plugin
   * @route {POST} /${namespace}/plugins/acceptsettings
   * @bodyparam {String} plugin Name of plugin
   * @bodyparam {Object} settings Settings
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/app/acceptsettings`, server.ensureApplicationByRoles('ng-rt-admin', ['admin']), middlewareImmutable, pluginManagerUploadCLIMiddleware, acceptSettingsHandler);

  const unsintallHandler = (req, res) => {
    let pluginsManager = server.plugin_manager;
    let publishToFeed = req.body.publishToFeed === true;
    pluginsManager.uninstall(req.body.pluginName, false, publishToFeed).then(result => {
      logger.debug('uninstall', req.body.pluginName, 'resolved');
      res.status(200).end();
    }).catch(err => {
      logger.debug('error on uninstall', err);
      res.status(500).json(err).end();
    });
  };

  /**
   * Uninstall plugin
   *
   * @name Uninstall plugin
   * @route {POST} /${namespace}/plugins/uninstall
   * @bodyparam {String} pluginName Name of plugin
   * @bodyparam {String} storage Storage type
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/uninstall`, server.ensureUserRoles(["admin"]), middlewareImmutable, pluginManagerUploadUIMiddleware, unsintallHandler);

  /**
   * Uninstall plugin for applications
   *
   * @name Uninstall plugin
   * @route {POST} /${namespace}/plugins/app/uninstall
   * @bodyparam {String} pluginName Name of plugin
   * @bodyparam {String} storage Storage type
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/app/uninstall`, server.ensureApplicationByRoles('ng-rt-admin', ['admin']), middlewareImmutable, pluginManagerUploadCLIMiddleware, unsintallHandler);

  const activatePliuginHandler = (req, res) => {
    let pluginsManager = server.plugin_manager;
    let publishToFeed = req.body.publishToFeed === true;
    pluginsManager.activate(req.body.pluginName, publishToFeed).then(result => {
      logger.debug('activate', req.body.pluginName, 'resolved');
      // socket.emit("activate_result", result);
      res.status(200).end();
    }).catch(err => {
      logger.debug("activate result error", err);
      res.status(500).end();
    });
  };

  /**
   * Activate plugin
   *
   * @name Activate plugin
   * @route {POST} /${namespace}/plugins/activate
   * @bodyparam {String} pluginName Name of plugin
   * @bodyparam {String} storage Storage type
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/activate`, server.ensureUserRoles(["admin"]), middlewareImmutable, pluginManagerUploadUIMiddleware, activatePliuginHandler);

  /**
   * Activate plugin for applications
   *
   * @name Activate plugin
   * @route {POST} /${namespace}/plugins/app/activate
   * @bodyparam {String} pluginName Name of plugin
   * @bodyparam {String} storage Storage type
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/app/activate`, server.ensureApplicationByRoles('ng-rt-admin', ['admin']), middlewareImmutable, pluginManagerUploadCLIMiddleware, activatePliuginHandler);

  const deactivatePluginHandler = (req, res) => {
    let pluginsManager = server.plugin_manager;
    let publishToFeed = req.body.publishToFeed === true;
    pluginsManager.deactivate(req.body.pluginName, false, publishToFeed).then(result => {
      res.status(200).end();
    }).catch(err => {
      logger.debug('catched', err);
      res.status(500).json(err).end();
    });
  };

  /**
   * Deactivate plugin
   *
   * @name Deactivate plugin
   * @route {POST} /${namespace}/plugins/deactivate
   * @bodyparam {String} pluginName Name of plugin
   * @bodyparam {String} storage Storage type
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/deactivate`, server.ensureUserRoles(["admin"]), middlewareImmutable, pluginManagerUploadUIMiddleware, deactivatePluginHandler);

  /**
   * Deactivate plugin for applications
   *
   * @name Deactivate plugin
   * @route {POST} /${namespace}/plugins/app/deactivate
   * @bodyparam {String} pluginName Name of plugin
   * @bodyparam {String} storage Storage type
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/app/deactivate`, server.ensureApplicationByRoles('ng-rt-admin', ['admin']), middlewareImmutable, pluginManagerUploadCLIMiddleware, deactivatePluginHandler);

  const removePluginHandler = (req, res) => {
    let pluginsManager = server.plugin_manager;
    let publishToFeed = req.body.publishToFeed === true;
    pluginsManager.remove(req.body.pluginName, false, publishToFeed).then(result => {
      res.status(200).end();
    }).catch(err => {
      logger.debug('catched', err);
      res.status(500).end();
    });
  };

  /**
   * Remove plugin
   *
   * @name Remove plugin
   * @route {POST} /${namespace}/plugins/remove
   * @bodyparam {String} pluginName Name of plugin
   * @bodyparam {String} storage Storage type
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/remove`, server.ensureUserRoles(["admin"]), middlewareImmutable, pluginManagerUploadUIMiddleware, removePluginHandler);

  /**
   * Remove plugin
   *
   * @name Remove plugin
   * @route {POST} /${namespace}/plugins/app/remove
   * @bodyparam {String} pluginName Name of plugin
   * @bodyparam {String} storage Storage type
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/app/remove`, server.ensureApplicationByRoles('ng-rt-admin', ['admin']), middlewareImmutable, pluginManagerUploadCLIMiddleware, removePluginHandler);

  /**
   * Publish plugin
   *
   * @name Publish plugin
   * @route {POST} /${namespace}/plugins/publish
   * @bodyparam {String} pluginName Name of plugin
   * @bodyparam {String} storage Storage type
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/publish`, server.ensureUserRoles(["admin"]), middlewareImmutable, pluginManagerUploadUIMiddleware, (req, res) => {
    let pluginsManager = server.plugin_manager;
    pluginsManager.publish(req.body.pluginName, req.body.storage).then(() => {
      res.status(200).end();
    }).catch(err => {
      res.status(500).json(err).end();
    });
  });

  /**
   * Get plugin's license
   *
   * @name Get plugin's license
   * @route {POST} /${namespace}/plugins/license
   * @bodyparam {String} pluginName Name of plugin
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/license`, server.ensureUserRoles(["admin"]), (req, res) => {
    let pluginsManager = server.plugin_manager;
    pluginsManager.getLicense(req.body.pluginName).then(license => {
      res.status(200).json(license).end();
    }).catch(err => {
      res.status(500).json(err).end();
    });
  });

  /**
   * Get plugin's incstruction
   *
   * @name Get plugin's incstruction
   * @route {POST} /${namespace}/plugins/instruction
   * @bodyparam {String} pluginName Name of plugin
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/instruction`, server.ensureUserRoles(["admin"]), (req, res) => {
    let pluginsManager = server.plugin_manager;
    pluginsManager.getInstruction(req.body.pluginName).then(instruction => {
      res.status(200).json(instruction).end();
    }).catch(err => {
      res.status(500).json(err).end();
    });
  });

  /**
   * Use plugin as application
   *
   * @name Use plugin as application
   * @route {POST} /${namespace}/plugins/asapp
   * @bodyparam {String} pluginName Name of plugin
   * @bodyparam {Boolean} asApp As application flag
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/asapp`, server.ensureUserRoles(["admin"]), (req, res) => {
    let pluginsManager = server.plugin_manager;
    let params = req.body;
    let pluginName = params.pluginName;
    let asApp = params.asApp;
    pluginsManager.setAsApp(pluginName, asApp).then(r => {
      res.status(200).end();
    }).catch(err => {
      res.status(500).json(err).end();
    });
  });

  /**
   * Toggle asSubscription for plugin
   *
   * @name Toggle asSubscription for plugin
   * @route {POST} /${namespace}/plugins/assubscription
   * @bodyparam {String} pluginName Name of plugin
   * @bodyparam {Boolean} asSubscription As subscription flag
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/assubscription`, server.ensureUserRoles(["admin"]), (req, res) => {
    logger.debug('Executing plugins/assubscription');
    let pluginsManager = server.plugin_manager;
    let params = req.body;
    let pluginName = params.pluginName;
    let asSubscription = params.asSubscription;
    logger.debug('asSubscription :', asSubscription);

    pluginsManager.setAsSubscription(pluginName, asSubscription).then(r => {
      res.status(200).end();
    }).catch(err => {
      res.status(500).json(err).end();
    });
  });

  /**
   * Check if plugin has updates
   *
   * @name Check if plugin has updates
   * @route {POST} /${namespace}/plugins/hasupdates
   * @bodyparam {String} pluginName Name of plugin
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/hasupdates`, server.ensureUserRoles(["admin"]), (req, res) => {
    let pluginsManager = server.plugin_manager;
    pluginsManager.hasUpdates(req.body.pluginName).then(ret => {
      res.status(200).json(ret);
    }).catch(err => {
      res.status(500).send(err);
    }).then(() => {
      res.end();
    });
  });

  const updatePluginHandler = (req, res) => {
    let pluginsManager = server.plugin_manager;
    pluginsManager.hasUpdates(req.body.pluginName).then(ret => {
      if (!ret.has) {
        return Promise.reject("No updates");
      }
      return pluginsManager.update(req.body.pluginName, null, null, ret.hotfix);
    }).then(() => {
      res.status(200).end();
    }).catch(err => {
      res.status(500).send(err);
    });
  };

  /**
   * Update plugin
   *
   * @name Update plugin
   * @route {POST} /${namespace}/plugins/update
   * @bodyparam {String} pluginName Name of plugin
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/update`, server.ensureUserRoles(["admin"]), middlewareImmutable, pluginManagerUploadUIMiddleware, updatePluginHandler);

  /**
   * Update plugin for applications
   *
   * @name Update plugin
   * @route {POST} /${namespace}/plugins/app/update
   * @bodyparam {String} pluginName Name of plugin
   * @authentication Requires valid session token
   */
  server.post(`/${namespace}/plugins/app/update`, server.ensureApplicationByRoles('ng-rt-admin', ['admin']), middlewareImmutable, pluginManagerUploadCLIMiddleware, updatePluginHandler);

  server.get(`/${namespace}/plugins/ready`, server.ensureLoggedIn(), (req, res) => {
    let pluginsManager = server.plugin_manager;
    res.status(200).json(pluginsManager.ready).end();
  });

  const pluginConfigsHandler = function(req, res) {
    let pluginConfigs = server.plugin_manager.configs.get(req.query.plugin);
    let configs = {...pluginConfigs.get(req.query.config) };
    server.plugin_manager.get_manifest(req.query.plugin).then(manifest => {
      let settings = manifest.settings;
      Object.keys(configs).forEach(conf => {
        let manSet = settings.find(s => s.name === conf);
        if (manSet && manSet.choose) {
          configs[conf] = {
            choose: manSet.choose,
            default: configs[conf]
          };
        }
      });
      return res.status(200).json(configs).end();
    });
  };

  server.get(`/${namespace}/plugins/configs`, server.ensureLoggedIn(), pluginConfigsHandler);

  const pluginConfigsPostHandler = function(req, res) {
    let pluginConfigs = server.plugin_manager.configs.get(req.body.plugin);
    let configs = req.body.configs;
    configs.forEach(async c => {
      await pluginConfigs.set(c.key, c.value);
    });
    pluginConfigs.save(err => {
      if (err) {
        return res.status(500).json(err).end;
      }
      res.status(200).end();
    });
  };

  server.post(`/${namespace}/plugins/configs`, server.ensureUserRoles(["admin"]), pluginConfigsPostHandler);

  const addByBucketKey = (req, res) => {
    let pluginsManager = server.plugin_manager;
    let bucket = req.body.bucket;
    let key = req.body.key;
    let storage = req.body.storage;

    pluginsManager.add_by_key(bucket, key, storage).then(result => {
      logger.trace("Plugin added");
      res.status(200);
    }).catch(err => {
      logger.error(err);
      res.status(500).json(err);
    }).then(() => {
      res.end();
    });
  };

  server.post(`/${namespace}/plugins/addbybucket`, server.ensureUserRoles(["admin"]), middlewareImmutable, pluginManagerUploadUIMiddleware, addByBucketKey);

  /**
   * Get files(plugins) from s3 bucket
   *
   * @name  Get files(plugins) from s3 bucket
   * @route {GET} /${namespace}/bucketName
   * @authentication Requires an valid Session Token as role 'admin'
   * @urlparam {String} bucketName the name of the Bucket
   */
  server.get(`/${namespace}/plugins/s3bucket/:bucketName/`, server.ensureUserRoles(["admin"]), (req, res) => {
    const bucketName = req.params.bucketName;
    server.plugin_manager.listBucketObjects(bucketName, `${process.env.CORE_VERSION}/latest`).then(data => {
      res.send({ items: data.Contents.filter(c => c.Key.indexOf('.zip') > 0) });
    }).catch(err => {
      logger.error(err);
      res.status(500).end();
      return;
    });
  });

  server.get(`/${namespace}/plugins/s3buckets`, server.ensureUserRoles(["admin"]), (req, res) => {
    server.plugin_manager.listBuckets().then(data => {
      res.send(data.Buckets.map(b => b.Name));
    }).catch(err => {
      logger.error(err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    });
  });

  server.get(`/${namespace}/plugin/:name`, server.ensureUserRoles(["admin"]), (req, res) => {
    server.plugin_manager.getPlugin(req.params.name).then(plugin => {
      res.send(plugin);
    }).catch(err => {
      logger.error(err);
      res.status(500).json({
        success: false,
        error: err
      });
    });
  });
};