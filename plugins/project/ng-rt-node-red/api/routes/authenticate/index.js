'use strict';
const logger = require('log4js').getLogger('ng-rt-node-red.authenticate');

module.exports = (server, pluginSettings) => {
  const i18n = server.plugin_manager.services.get('i18n');
  const configService = server.plugin_manager.services.get('configService');
  let adminAuth = {
    type: "credentials",
    sessionExpiryTime: pluginSettings.get("node-red.sessionExpiryTime")
  };
  if (pluginSettings.get("node-red.coreAuthentication") === true) {
    let servers = configService.get('servers');
    let auth;
    if (servers["ng-rt-jwt-auth"]) {
      logger.debug("node-red", i18n.__("core remote authentication"));
      delete require.cache[require.resolve('./remote')];
      auth = require('./remote')(servers["ng-rt-jwt-auth"], pluginSettings.get('node-red.roles'));
    } else {
      logger.debug("node-red", i18n.__("core local authentication"));
      delete require.cache[require.resolve('./local')];
      auth = require('./local')(server.models.user, pluginSettings.get('node-red.roles'));
    }
    adminAuth.authenticate = auth.authenticate;
    adminAuth.users = auth.users;
  } else {
    logger.debug("node-red", i18n.__("internal authentication"));
    let users = pluginSettings.get["node-red.users"];
    if (users && Array.isArray(users))
      adminAuth.users = users;
    else {
      adminAuth.users = [{
        username: pluginSettings.get("node-red.username"),
        password: pluginSettings.get("node-red.password"),
        permissions: pluginSettings.get("node-red.permissions")
      }];
    }
  }
  return adminAuth;
};
