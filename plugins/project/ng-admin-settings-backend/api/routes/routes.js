'use strict';

const logger = require('log4js').getLogger('ng-admin-settings-backend.routes');
const path = require('path');
// const log4jsConfig = require(path.resolve(
//   __dirname,
//   "../../../../../config/server/log4js.json"
// ));

/**
 * API/Route/ng-admin-settings
 *
 * @module API/Route/ng-admin-settings
 * @type {Object}
 */

let server;
let i18n;
let pluginSettings;
let namespace;
let services;
let configService;
let log4jsService;

const asyncMiddleware = fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
  };

const init = (_server, plugin) => {
  server = _server;
  services = server.plugin_manager.services;
  i18n = services.get('i18n');
  pluginSettings = server.plugin_manager.configs.get(plugin);
  namespace = pluginSettings.get('namespace');
  configService = services.get("configService");
  log4jsService = services.get("log4jsService");
};

const getToast = (req, res) => {
  logger.debug(i18n.__(`GET ${namespace}/toast`));
  return server.models.toast
    .find({
      where: {
        "user.username": req.user.username
      }
    })
    .then(toasts => {
      logger.trace("toasts =", toasts);
      res.json({
        success: true,
        toasts
      });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        error: err.message
      });
    });
};

const postToast = (req, res) => {
  logger.debug(`POST ${namespace}/toast`);
  logger.trace("req.user =", req.user);
  logger.trace("req.body =", req.body);
  let toast = {
    msg: req.body.msg,
    type: req.body.type,
    user: req.user,
    date: new Date()
  };
  return server.models.toast
    .create(toast)
    .then(() => {
      res.json({
        success: true,
        toast
      });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        error: err.message
      });
    });
};

const getSettings = (req, res, pluginInstance) => {
  logger.debug(`GET /${namespace}/settings`);
  res.json({
    success: true,
    settings: {
      profileEditors: pluginInstance.config.get("profileEditors"),
      requireTerms: pluginInstance.config.get("requireTerms"),
      keysStrategy: pluginInstance.config.get("keysStrategy"),
      redirectFromHomeRules: pluginInstance.config.get(
        "redirectFromHomeRules"
      )
    }
  });
};

const getRequireFullName = (req, res, pluginInstance) => {
  logger.debug(`GET /${namespace}/settings/requirefullname`);
  res.json({
    success: true,
    settings: {
      requireFullname: pluginInstance.config.get("requireFullname")
    }
  });
};

const getConfig = (req, res, pluginInstance) => {
  if (req.body.plugin) {
    logger.debug("Plugin :", req.body.plugin);
  }

  res.send({
    maxFileSize: configService.get("maxFileSize"),
    servers: configService.get("servers"),
    storages: configService.get("storages"),
    keysStrategy: pluginInstance.config.get("keysStrategy")
    // log4js: log4jsConfig.client || {}
  });
};

const getMaintenance = (req, res) => {
  logger.debug(i18n.__(`executing GET /${namespace}/maintenance`));

  res.send(configService.get('maintenance'));

};

const getSystemSettingsLandscape = (req, res) => {
  logger.debug(i18n.__(`executing GET /${namespace}/system_settings_landscape`));

  res.send({
    mongoDBHost: configService.get("datasources.mongoDB.host"),
    mongoDBPort: configService.get("datasources.mongoDB.port"),
    messagingHost: configService.get("messagingHost"),
    messagingPort: configService.get("messagingPort"),
    messagingAdmin: configService.get("messagingAdmin"),
    log4jsMongoHost: configService.get("log4jsMongoHost"),
    log4jsMongoPort: configService.get("log4jsMongoPort"),
    ngrtStatsdHost: configService.get("ngrtStatsdHost"),
    ngrtStatsdPort: configService.get("ngrtStatsdPort"),
    ngrtStatsdAdminPort: configService.get("ngrtStatsdAdminPort"),
    smartContractsHost: configService.get("smartContractsHost"),
    smartContractsPort: configService.get("smartContractsPort"),
    ngrtPort: configService.get("ngrtPort"),
    nodeRedPort: configService.get("nodeRedPort"),
    clusterId: configService.get("clusterId"),
    serverEnvironment: configService.get("serverEnvironment"),
    instanceId: configService.get("instanceId"),
    tenantId: configService.get("tenantId"),
    defaultDomainId: configService.get("defaultDomainId"),
    jwtAuthInstanceId: configService.get("jwtAuthInstanceId"),
    jwtAuthTenantId: configService.get("jwtAuthTenantId"),
    log4jsMongoDatabase: configService.get("log4jsMongoDatabase"),
    publicDNSName: configService.get("publicDNSName"),
    internalDNSName: configService.get("internalDNSName"),
    namespace: configService.get("namespace"),
    databaseType: configService.get("databaseType")
  });
};

const postSystemSettingsLandscape = async (req, res) => {
  logger.debug(i18n.__(`executing POST /${namespace}/system_settings_landscape`));
  logger.trace(req.body);

  /**
   * @param {*} serviceName Servicename
   * @param {*} name Name
   */
  async function checkInBodyAndAddStr(serviceName, name) {
    if (req.body[name]) {
      await configService.add(serviceName, req.body[name], req.body.publishToFeed === false);
    }
  }
  /**
   * @param {*} serviceName Servicename
   * @param {*} name Name
   */
  async function checkInBodyAndAddNum(serviceName, name) {
    if (typeof req.body[name] === 'undefined')
      return;
    const value = Number(req.body[name]);
    if (!Number.isNaN(value)) {
      await configService.add(serviceName, value, req.body.publishToFeed === false);
    }
  }

  await checkInBodyAndAddStr("datasources.mongoDB.host", "mongoDBHost");
  await checkInBodyAndAddStr("ng-rt-dataDictionary.mongoHost", "mongoDBHost");
  await checkInBodyAndAddNum("datasources.mongoDB.port", "mongoDBPort");
  await checkInBodyAndAddStr("messagingHost", "messagingHost");
  await checkInBodyAndAddNum("messagingPort", "messagingPort");
  await checkInBodyAndAddStr("messagingAdmin", "messagingAdmin");
  await checkInBodyAndAddStr("log4jsMongoHost", "log4jsMongoHost");
  await checkInBodyAndAddNum("log4jsMongoPort", "log4jsMongoPort");
  await checkInBodyAndAddStr("ngrtStatsdHost", "ngrtStatsdHost");
  await checkInBodyAndAddNum("ngrtStatsdPort", "ngrtStatsdPort");
  await checkInBodyAndAddNum("ngrtStatsdAdminPort", "ngrtStatsdAdminPort");
  await checkInBodyAndAddStr("smartContractsHost", "smartContractsHost");
  await checkInBodyAndAddNum("smartContractsPort", "smartContractsPort");
  await checkInBodyAndAddNum("ngrtPort", "ngrtPort");
  await checkInBodyAndAddNum("nodeRedPort", "nodeRedPort");
  await checkInBodyAndAddStr("clusterId", "clusterId");
  await checkInBodyAndAddStr("serverEnvironment", "serverEnvironment");
  await checkInBodyAndAddStr("instanceId", "instanceId");
  await checkInBodyAndAddStr("tenantId", "tenantId");
  await checkInBodyAndAddStr("defaultDomainId", "defaultDomainId");
  await checkInBodyAndAddStr("jwtAuthInstanceId", "jwtAuthInstanceId");
  await checkInBodyAndAddStr("jwtAuthTenantId", "jwtAuthTenantId");
  await checkInBodyAndAddStr("log4jsMongoDatabase", "log4jsMongoDatabase");
  await checkInBodyAndAddStr("publicDNSName", "publicDNSName");
  await checkInBodyAndAddStr("internalDNSName", "internalDNSName");
  await checkInBodyAndAddStr("namespace", "namespace");
  await checkInBodyAndAddStr("databaseType", "databaseType");

  res.send({});
};

const getSystemSettingsSecurity = (req, res) => {
  logger.debug("executing GET /system_settings_security");

  res.send({
    aws: configService.get("aws"),
    jwt: configService.get("jwt")
  });
};

const postSystemSettingsSecurity = async (req, res) => {
  logger.debug(i18n.__("executing POST /system_settings_security"));
  logger.trace(i18n.__("system_settings_security :", req.body));

  if (req.body.aws)
    await configService.addMultiple({
      aws: req.body.aws
    }, req.body.publishToFeed === false);

  if (req.body.jwt)
    await configService.addMultiple({
      jwt: req.body.jwt
    }, req.body.publishToFeed === false);

  res.send({});
};

const getSystemSettingsSystem = (req, res) => {
  logger.debug(i18n.__("executing GET /system_settings_system"));

  res.send({
    activeTrustLevelEnabled: configService.get("active_trust_levels"),
    maintenance: configService.get("maintenance"),
    selfRegistrationEnabled: configService.get("disableSelfRegistration"),
    debugAppUseConnectLoggerEnabled: configService.get(
      "debug.app-use-connectLogger"
    ),
    autoUpdateEnabled: configService.get("autoUpdate.active"),
    immutableEnabled: configService.get("containerStatus.immutable"),
    showRoutesEnabled: configService.get("showRoutes"),
    skipHotfixEnabled: configService.get("skipHotfix"),
    showUsersOnlineEnabled: configService.get("showUsersOnline"),
    showServicesEnabled: configService.get("showServices"),
    showConfigDiffEnabled: configService.get("showConfigDiff"),
    syncPluginEnabled: configService.get("pluginsFeed.enabled"),
    syncConfigEnabled: configService.get("configFeed.enabled"),
    logLevel: log4jsService.getLogLevel(),
    stateUnlocked: configService.get("containerStatus.state"),
    pluginManagerUploadCLI: configService.get("containerStatus.pluginManagerUploadCLI"),
    pluginManagerUploadUI: configService.get("containerStatus.pluginManagerUploadUI")
  });
};

const postSystemSettingsSystem = async (req, res) => {
  logger.debug(i18n.__("executing POST /system_settings_system"));
  logger.trace(i18n.__(" req.body :", req.body));

  /**
   *
   * @param {*} configName ConifgName
   * @param {*} name name
   * @param {*} isBoolean isBoolean
   */
  async function checkAndPutConfig(configName, name, isBoolean = true) {
    if (req.body[name] !== undefined) {
      let val = isBoolean ? Boolean(req.body[name]) : req.body[name];
      await configService.add(
        configName,
        val,
        req.body.publishToFeed === false
      );
    }
  }

  /**
   * @param {*} serviceName Servicename
    * @param {*} name Name
    */
  async function checkInBodyAndAddStr(serviceName, name) {
    if (req.body[name]) {
      await configService.add(serviceName, req.body[name], req.body.publishToFeed === false);
    }
  }

  try {
    await Promise.all([checkAndPutConfig("active_trust_levels", "activeTrustLevelEnabled"),
    checkAndPutConfig("disableSelfRegistration", "selfRegistrationEnabled"),
    checkAndPutConfig("debug.app-use-connectLogger", "debugAppUseConnectLoggerEnabled"),
    checkAndPutConfig("autoUpdate.active", "autoUpdateEnabled"),
    checkAndPutConfig("containerStatus.immutable", "immutableEnabled"),
    checkAndPutConfig("showRoutes", "showRoutesEnabled"),
    checkAndPutConfig("showServices", "showServicesEnabled"),
    checkAndPutConfig("showConfigDiff", "showConfigDiffEnabled"),
    checkAndPutConfig("showUsersOnline", "showUsersOnlineEnabled"),
    checkAndPutConfig("maintenance.enabled", "maintenanceEnabled"),
    checkAndPutConfig("maintenance.maintenanceText", "maintenanceText", false),
    checkAndPutConfig("pluginsFeed.enabled", "syncPluginEnabled"),
    checkAndPutConfig("configFeed.enabled", "syncConfigEnabled"),
    checkAndPutConfig("skipHotfix", "skipHotfixEnabled"),
    checkInBodyAndAddStr("containerStatus.state", "stateUnlocked"),
    checkAndPutConfig("containerStatus.pluginManagerUploadCLI", "pluginManagerUploadCLI"),
    checkAndPutConfig("containerStatus.pluginManagerUploadUI", "pluginManagerUploadUI")
    ]);

    if (req.body.logLevel)
      log4jsService.updateLogLevel(req.body.logLevel);

    res.send({});
  } catch (e) {
    res.send(e);
  }
};

const getSystemSettingsEmail = (req, res) => {
  logger.debug(i18n.__("executing GET /system_settings_email"));

  if (configService.get("email"))
    res.send({
      email: configService.get("email")
    });
};

const postSystemSettingsEmail = async (req, res) => {
  logger.debug(i18n.__("executing POST /system_settings_email"));
  if (req.body.email)
    await configService.addMultiple({
      email: req.body.email
    }, req.body.publishToFeed === false);
  res.send({});
};

const activate = (server, plugin, pluginInstance) => {
  init(server, plugin);

  logger.debug(i18n.__('Plugin name : %s', pluginInstance.name));
  logger.debug(i18n.__('ng-admin-settings-backend routes init'));
  logger.debug(i18n.__('Server type : %s', configService.get('serverEnvironment')));

  // retrieve Plugin specific configuration
  logger.debug(i18n.__('setting1 :%s', pluginSettings.get('setting1')));

  // Static route for HTML renderer
  server.use(`/${namespace}/`, server.loopback.static(path.normalize(
    path.resolve(__dirname, '../../ui'))));

  server.get(`/${namespace}/toast`, server.ensureLoggedIn(), getToast);

  server.post(`/${namespace}/toast`, server.ensureLoggedIn(), postToast);

  /**
   * Get public part of plugin specific config
   *
   * @name Get public part of plugin specific config
   * @route {GET} /${namespace}/config
   * @authentication Requires an valid Session Token
   * @bodyparam {Object} config public part of config
   */
  server.get(
    `/${namespace}/settings`,
    server.ensureLoggedIn(), (req, res) => {
      getSettings(req, res, pluginInstance);
    });

  /**
   * Get required attribute for full name
   *
   * @name Get required attribute for full name
   * @route {GET} /${namespace}/settings/requirefullname
   * @bodyparam {Boolean} flag for required
   */
  server.get(`/${namespace}/settings/requirefullname`, (req, res) => {
    getRequireFullName(req, res, pluginInstance);
  });

  /**
   * Get some system configuration
   *
   * @name Get some system configuration
   *
   * @route {GET} /${namespace}/config
   * @authentication None
   * @bodyparam {String} maxFileSize Maximum Filezie for uploads
   * @bodyparam {servers} servers List of servers
   * @bodyparam {storages} List of storages
   */
  server.get(`/${namespace}/config`, (req, res) => {
    getConfig(req, res, pluginInstance);
  });

  /**
   * Retrieve System configuration for the system landscape settings
   *
   * @name Retrieve System landscape settings
   * @route {GET} /${namespace}/system_settings_landscape
   * @authentication Requires an valid Session Token
   * @bodyparam {String} mongoDBHost
   * @bodyparam {String} mongoDBPort
   * @bodyparam {String} rethinkHost
   * @bodyparam {String} rethinkPort
   * @bodyparam {String} messagingHost
   * @bodyparam {String} messagingPort
   * @bodyparam {String} messagingAdmin
   * @bodyparam {String} log4jsMongoHost
   * @bodyparam {String} log4jsMongoPort
   * @bodyparam {String} ngrtStatsdHost
   * @bodyparam {String} ngrtStatsdPort
   * @bodyparam {String} smartContractsHost
   * @bodyparam {String} smartContractsPort
   * @bodyparam {String} ngrtPort
   * @bodyparam {String} clusterId
   * @bodyparam {String} serverEnvironment
   * @bodyparam {String} instanceId
   * @bodyparam {String} tenantId
   * @bodyparam {String} defaultDomainId
   * @bodyparam {String} jwtAuthInstanceId
   * @bodyparam {String} jwtAuthTenantId
   * @bodyparam {String} log4jsMongoDatabase
   * @bodyparam {String} publicDNSName
   * @bodyparam {String} internalDNSName
   * @bodyparam {String} namespace
   * @bodyparam {String} databaseType
   *
   */
  server.get(
    `/${namespace}/system_settings_landscape`,
    server.ensureUserRoles(["sysadmin"]), getSystemSettingsLandscape);

  /**
   * Update System configuraiton for the system landscape settings
   *
   * @name Update System landscape settings
   * @route {POST} /${namespace}/system_settings_landscape
   * @authentication Requires an valid Session Token
   * @bodyparam {String} [mongoDBHost]
   * @bodyparam {String} [mongoDBPort]
   * @bodyparam {String} [mongoDBHost]
   * @bodyparam {String} [mongoDBPort]
   * @bodyparam {String} [rethinkHost]
   * @bodyparam {String} [rethinkPort]
   * @bodyparam {String} [messagingHost]
   * @bodyparam {String} [messagingPort]
   * @bodyparam {String} [messagingAdmin]
   * @bodyparam {String} [log4jsMongoHost]
   * @bodyparam {String} [log4jsMongoPort]
   * @bodyparam {String} [ngrtStatsdHost]
   * @bodyparam {String} [ngrtStatsdPort]
   * @bodyparam {String} [smartContractsHost]
   * @bodyparam {String} [smartContractsPort]
   * @bodyparam {String} [ngrtPort]
   * @bodyparam {String} [clusterId]
   * @bodyparam {String} [serverEnvironment]
   * @bodyparam {String} [instanceId]
   * @bodyparam {String} [tenantId]
   * @bodyparam {String} [defaultDomainId]
   * @bodyparam {String} [jwtAuthInstanceId]
   * @bodyparam {String} [jwtAuthTenantId]
   * @bodyparam {String} [log4jsMongoDatabase]
   * @bodyparam {String} [publicDNSName]
   * @bodyparam {String} [internalDNSName]
   * @bodyparam {String} [namespace]
   * @bodyparam {String} [databaseType]
   *
   */
  server.post(
    `/${namespace}/system_settings_landscape`,
    server.ensureUserRoles(["sysadmin"]), asyncMiddleware(postSystemSettingsLandscape));

  /**
   * Retrieve System security settings
   *
   * @name  Retrieve System security settings
   * @route {GET} /${namespace}/system_settings_security
   * @authentication Requires an valid Session Token as role 'Sysadmin'
   * @bodyparam {String} aws
   * @bodyparam {String} jwt aws: aws jwt: jwt
   */
  server.get(
    `/${namespace}/system_settings_security`,
    server.ensureUserRoles(["sysadmin"]), getSystemSettingsSecurity);

  /**
   * Update System security settings
   *
   * @name  Update System security settings
   * @route {POST} /${namespace}/system_settings_security
   * @authentication Requires an valid Session Token as role 'Sysadmin'
   * @bodyparam {String} [aws]
   * @bodyparam {String} [jwt]
   */
  server.post(
    `/${namespace}/system_settings_security`,
    server.ensureUserRoles(["sysadmin"]), postSystemSettingsSecurity);

  /**
   * Retrieve System settings
   *
   * @name  Retrieve System  settings
   * @route {GET} /${namespace}/system_settings_system
   * @authentication Requires an valid Session Token as role 'Sysadmin'
   * @bodyparam {Boolean} activeTrustLevelEnabled
   * @bodyparam {String} maintenance
   * @bodyparam {Boolean} selfRegistrationEnabled
   * @bodyparam {Boolean} debugAppUseConnectLoggerEnabled
   * @bodyparam {Boolean} autoUpdateEnabled
   * @bodyparam {Boolean} immutableEnabled
   * @bodyparam {Boolean} showRoutesEnabled
   * @bodyparam {Boolean} showUsersOnlineEnabled
   * @bodyparam {Boolean} showServicesEnabled
   * @bodyparam {Boolean} showConfigDiffEnabled
   * @bodyparam {Boolean} syncConfigEnabled
   * @bodyparam {Boolean} syncPluginEnabled
   * @bodyparam {Boolean} skipHotfixEnabled
   * @bodyparam {Boolean} stateUnlocked
   * @bodyparam {Boolean} pluginManagerUploadCLI
   * @bodyparam {Boolean} pluginManagerUploadUI
   */
  server.get(
    `/${namespace}/system_settings_system`,
    server.ensureUserRoles(["sysadmin"]), getSystemSettingsSystem);

  /**
   * Update System settings
   *
   * @name  Update System  settings
   * @route {POST} /${namespace}/system_settings_system
   * @authentication Requires an valid Session Token as role 'Sysadmin'
   * @bodyparam {Boolean} [activeTrustLevelEnabled]
   * @bodyparam {Boolean} [selfRegistrationEnabled]
   * @bodyparam {Boolean} [debugAppUseConnectLoggerEnabled]
   * @bodyparam {Boolean} [autoUpdateEnabled]
   * @bodyparam {Boolean} [immutableEnabled]
   * @bodyparam {Boolean} [showRoutesEnabled]
   * @bodyparam {Boolean} [showUsersOnlineEnabled]
   * @bodyparam {Boolean} [showServicesEnabled]
   * @bodyparam {Boolean} [showConfigDiffEnabled]
   * @bodyparam {Boolean} [maintenanceEnabled]
   * @bodyparam {String} [maintenanceText]
   * @bodyparam {Boolean} [skipHotfix]
   * @bodyparam {Boolean} syncConfigEnabled
   * @bodyparam {Boolean} syncPluginEnabled
   * @bodyparam {Boolean} [stateUnlocked]
   * @bodyparam {Boolean} [pluginManagerUploadCLI]
   * @bodyparam {Boolean} [pluginManagerUploadUI]
   */
  server.post(
    `/${namespace}/system_settings_system`,
    server.ensureUserRoles(["sysadmin"]), postSystemSettingsSystem);

  /**
   * Retrieve System email settings
   *
   * @name  Update System email settings
   * @route {GET} /${namespace}/system_settings_email
   * @authentication Requires an valid Session Token as role 'Sysadmin'
   * @bodyparam {JSON} email Email Settings
   */
  server.get(
    `/${namespace}/system_settings_email`,
    server.ensureUserRoles(["sysadmin"]), getSystemSettingsEmail);

  /**
   * Update System email settings
   *
   * @name  Update System email settings
   * @route {POST} /${namespace}/system_settings_email
   * @authentication Requires an valid Session Token as role 'Sysadmin'
   * @bodyparam {JSON} [email] Email Settings
   */
  server.post(
    `/${namespace}/system_settings_email`,
    server.ensureUserRoles(["sysadmin"]), postSystemSettingsEmail);

  /**
   * Get system maintenance settings
   *
   * @name  Get System maintenance settings
   * @route {GET} /${namespace}/maintenance
   */
  server.get(
    `/maintenance`, getMaintenance);
};

const deactivate = {

};

module.exports = {
  init,
  activate,
  deactivate,
  getConfig,
  getRequireFullName,
  getSettings,
  getSystemSettingsEmail,
  getSystemSettingsLandscape,
  getSystemSettingsSecurity,
  getSystemSettingsSystem,
  postSystemSettingsEmail,
  postSystemSettingsLandscape,
  postSystemSettingsSecurity,
  postSystemSettingsSystem
};
