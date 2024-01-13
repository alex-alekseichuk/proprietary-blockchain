'use strict';

/* eslint-disable complexity */

const licenseFile = require('nodejs-license-file');
const fs = require('fs');
var logger = require('log4js').getLogger('license.js');
var path = require("path");
const fileExists = require('file-exists');
const licenseValidator = require('./licenseValidator');

module.exports = function(configFilePath, i18n) {
  this.checkLicense = function(configService, application, __callback) {
    logger.debug(i18n.__('0106 : Checking license for %s ', application));
    let tempFile = "company.json";
    let template = require("../scripts/templates/license/project/v1.1/" + tempFile).join('\n');

    var licenseFilePath = './config/licenses/ng-rt-core.lic';

    try {
      const license = licenseFile.parse({
        publicKeyPath: path.resolve(__dirname, '../server/certs/public.pem'),
        licenseFilePath: licenseFilePath,
        template
      });

      if (!license.valid) {
        return __callback(new Error(i18n.__('0003 : Invalid license file')), false);
      }

      const validVersion = licenseValidator.versionValidate(license.data.applicationVersion);
      if (!validVersion) {
        return __callback(new Error(i18n.__('This license is not valid for current system version')), false);
      }

      let linesCountOld = configService.get('license.core.old.linesCount') || 31;
      let linesCountNew = configService.get('license.core.new.linesCount');
      let linesCount = length(license.data);
      if (linesCount != linesCountOld && linesCount != linesCountNew) { // without serial
        logger.error(i18n.__('0005 : LicenseFile::fileParseFnc: License file must have ' + linesCountOld + ' or ' + linesCountNew + ' lines, actual: ' + linesCount));
        return __callback(new Error(i18n.__('0005 : LicenseFile::fileParseFnc: License file must have ' + linesCountOld + ' or ' + linesCountNew + ' lines, actual: ' + linesCount)), false);
      }

      const expirationDate = Date.parse(license.data.expirationDate);
      var instanceType = license.data.instanceType;

      switch (instanceType) {
        case ('Demo'):
          instanceType = 'T';
          break;
        case ('Production'):
          instanceType = 'P';
          break;
        case ('Education'):
          instanceType = 'E';
          break;
        case ('Development'):
          instanceType = 'D';
          break;
        case ('Local'):
          instanceType = 'L';
          break;
        default:
          instanceType = 'T';
      }

      if (instanceType.toLowerCase() != configService.get('serverEnvironment').toLowerCase()) {
        logger.error(i18n.__('0003 : Invalid license type. Expected from license file %s - Found in configuration %s', instanceType, configService.get('serverEnvironment')));
        return __callback(new Error(i18n.__('0003 : Invalid license type. Expected from license file %s - Found in configuration %s', instanceType, configService.get('serverEnvironment'))), false);
      }

      if (Date.now() > expirationDate) {
        logger.error(i18n.__('0003 : License expired'));
        return __callback(new Error(i18n.__('0003 : License expired')), false);
      }

      process.env.LICENSE_PA1 = license.data.pa1;
      process.env.LICENSE_PA3 = license.data.pa3;

      // all good :-)
      return __callback(false, true);
    } catch (err) {
      logger.error('Error:', err);
    }
  };

  // function to retrive license parameters
  this.retrieveLicenseParameters = function(configService, cd) {
    let tempFile = "company.json";
    let template = require("../scripts/templates/license/project/v1.1/" + tempFile).join('\n');

    var licenseFilePath = './config/licenses/ng-rt-core.lic';
    try {
      const license = licenseFile.parse({
        publicKeyPath: path.resolve(__dirname, '../server/certs/public.pem'),
        licenseFilePath: licenseFilePath,
        template
      });
      return cd(license);
    } catch (err) {
      logger.error('Error:', err);
    }
  };

  this.checkPluginLicense = function(configService, application, plugin, pluginPath, __callback) {
    logger.debug(i18n.__('0106 : Checking license for %s ', plugin));

    let tempFile = "company.json";
    let template = require("../scripts/templates/license/project/v1.1/" + tempFile).join('\n');

    var pluginLicenseFilePath = path.resolve(__dirname, '../config/licenses', plugin + ".lic");

    if (!fileExists.sync(pluginLicenseFilePath)) {
      pluginLicenseFilePath = `./config/licenses/${plugin}.project.lic`;
    }

    try {
      fs.accessSync(pluginLicenseFilePath, fs.F_OK);
      // Do something
    } catch (e) {
      return __callback(null, 2);
    }

    try {
      let publicKeyPath = path.resolve(pluginPath, 'key.pem');
      const license = licenseFile.parse({
        publicKeyPath: fileExists.sync(publicKeyPath) ? publicKeyPath : path.resolve(__dirname, '../server/certs/public.pem'),
        licenseFilePath: pluginLicenseFilePath,
        template
      });

      if (!license.valid) {
        return __callback(new Error(i18n.__('0003 : Invalid license file')), false);
      }

      let linesCountOld = configService.get('license.plugin.old.linesCount') || 29;
      let linesCountNew = configService.get('license.plugin.new.linesCount');
      let linesCount = length(license.data);
      if (linesCount != linesCountOld && linesCount != linesCountNew) {// without serial
        logger.error(i18n.__('0005 : LicenseFile::fileParseFnc: License file must have  ' + linesCountOld + ' or ' + linesCountNew + ' lines, actual: ' + linesCount));
        return __callback(new Error(i18n.__('0005 : LicenseFile::fileParseFnc: License file must have ' + linesCountOld + ' or ' + linesCountNew + ' lines, actual: ' + linesCount)), false);
      }

      const expirationDate = Date.parse(license.data.expirationDate);

      if (Date.now() > expirationDate) {
        logger.error(i18n.__('0003 : License expired'));
        return __callback(false, 3);
      }
      // all good :-)
      return __callback(false, license.valid ? 1 : 4);
    } catch (err) {
      logger.error('Error:', err);
    }
  };

  /**
   *
   * @param {*} obj Name of the object
   * @return {*} Lenght of the object
   */
  function length(obj) {
    return Object.keys(obj).length;
  }
};
