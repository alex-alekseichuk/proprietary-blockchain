'use strict';
var logger = require("log4js").getLogger("Plugin_license_manager");
let License = require("../server/license");

/**
 * License manager
 * @param {string} configFilePath configuration file path
 * @param {object} services services manager
 * @param {object} application instance of application
 * @return {object} instance of license manasger
 */
function LicenseManager(configFilePath, services, application) {
  let i18n = services.get("i18n");

  /**
   * check plugin license
   * @param {string} plugin plugin name
   * @param {string} pluginPath plugin folder path
   * @return {Promise.<boolean>} resolve result of check license validation
   */
  function checkLicense(plugin, pluginPath) {
    return new Promise((resolve, reject) => {
      let license = new License(configFilePath, i18n);
      license.checkPluginLicense(services.get('configService'), application, plugin, pluginPath, (err, valid) => {
        if (err) {
          logger.error("Check plugin license error:", err);
          return reject();
        }
        logger.debug("License get", valid);
        return resolve(valid);
      });
    });
  }

  var MESSAGES = [
    "License validation disabled",
    "License verified successfully",
    "No license file",
    "License expired",
    "License file not valid",
    "Custom error"
  ];

  return {checkLicense: checkLicense, MESSAGES: MESSAGES};
}

module.exports = LicenseManager;
