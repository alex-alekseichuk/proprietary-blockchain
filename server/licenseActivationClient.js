// Author: Mary
'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('server.js');
const License = require('./license');
var keys = require('../utils/keys.js');
var request = require('request-promise');
var moment = require('moment');

(() => {
  const configService = require('ng-configservice');
  configService.read('config/server/config.json');

  const i18n = require('i18n');
  const period = 30;

  /**
  * Main Function to Add License Activation status on server start
  *
  * @method checkLicenseOnStart
  * @return {promise} resolve if License is activated/added or reject
  */
  function checkLicenseOnStart() {
    try {
      let checkLicenseData = checkLicense();
      if (checkLicenseData.isValid) {
        if (checkLicenseData.trailPeriod) writeLogs(checkLicenseData.trailPeriod, true, false);
        return Promise.resolve();
      }

      return postAndCheck().then(result => {
        if (result.trailPeriod) writeLogs(result.trailPeriod, true, false);
      });
    } catch (err) {
      return Promise.reject();
    }
  }

  /**
  * Function to check License Activation status during login
  *
  * @method checkLicenseActivationOnLogin
  * @param {String} isAdmin if Admin role or not
  * @return {boolean} true if activated false if trial period ended
  */
  function checkLicenseActivationOnLogin(isAdmin) {
    var responseLicenseActivate = true;
    let license30dayPeriod = configService.get("licenseActivation.activatedOn");
    try {
      let checkLicenseData = checkLicense();
      if (checkLicenseData.trailPeriod) writeLogs(checkLicenseData.trailPeriod, isAdmin, true);
    } catch (err) {
      responseLicenseActivate = false;
    }
    if (license30dayPeriod) {
      if (dateCheck(license30dayPeriod).isValid) {
        writeLogs(dateCheck(license30dayPeriod).trailPeriod, isAdmin, true);
      } else {
        responseLicenseActivate = false;
      }
    }
    return responseLicenseActivate;
  }
  /**
  * Main Function to check License Activation status
  *
  * @method licenseCheck
  * @param {String} isAdmin if Admin role or not
  * @param {String} logintime if user logged in or not
  * @return {boolean} true if License is Activated or false if not activated and date expired
  */
  function checkLicense() {
    let licenseActivation = configService.get('licenseActivation.data');
    if (!configService.get('licenseActivation.enabled'))
      return {trailPeriod: null, isValid: true};
    if (licenseActivation && licenseActivation.signature !== false)
      return verifyAvailableLicense();
    return {trailPeriod: null, isValid: false};
  }

  /**
  * Main Function to Add License Activation status
  *
  * @method postAndCheck
  * @return {promise} resolve if post to LIC server is success or reject
  */
  function postAndCheck() {
    return retrieveLicenseParametersP(configService)
      .then(licParams => {
        return postToLICServer(licParams.serial)
          .then(result => {
            if (!signatureVerification(result))
              return addLicensedate();
            return {trailPeriod: null, isValid: true};
          })
          .catch(err => addLicensedate());
      });
  }

  /**
  * Internal Function to Add License Activation status
  *
  * @method verifyAvailableLicense
  * @return {object} trial period and status
  */
  function verifyAvailableLicense() {
    let licenseActivation = configService.get('licenseActivation.data');
    if (signatureVerification(licenseActivation)) {
      if (licenseActivation.activated) return {isValid: true};
      let dateCheckData = dateCheck(licenseActivation.timestamp);
      // if (!licenseActivation.activated && !dateCheckData.isValid)
      if (!licenseActivation.activated)
      /* eslint-disable  no-negated-condition */
        if (!dateCheckData.isValid)// test points /* eslint-disable  no-negated-condition */
          throw (new Error(`Please activate your license now. The ${period}-day period has ended`));
        else
        return {trailPeriod: dateCheckData.trailPeriod, isValid: true};
    } else return addLicensedate();
  }

  /**
  * Signature verification function which verifies with the public provided by LIC server licenseManager
  *
  * @method signatureVerification
  * @param {object} resultVerify LicenseData Json
  * @return {boolean} Signature verified or not
  */
  function signatureVerification(resultVerify) {
    try {
      let flagCheck = resultVerify.activated;
      let txIDCheck = resultVerify.txID;
      let timestampCheck = resultVerify.timestamp;
      let signatureCheck = resultVerify.signature;
      let content = JSON.stringify({
        activated: flagCheck,
        txID: txIDCheck,
        timestamp: timestampCheck
      });
      let keyDecode = keys.bs58_decode(configService.get('licenseActivation.publicKey'));
      let signatureDecode = keys.bs58_decode(signatureCheck);
      return keys.async_verify(signatureDecode, content, keyDecode);
    } catch (e) {
      logger.error(i18n.__(`Could not verify the signature : ${e}`));
      return null;
    }
  }

  /**
  * Http post request to LIC server
  *
  * @method postToLICServer
  * @param {String} serialNumber License Serial Number
  * @param {String} isAdmin if Admin role or not
  * @return {promise} Json Body with Flag,TxID,signature,timeStamp
  */
  async function postToLICServer(serialNumber) {
    const options = {
      url: configService.get('licenseActivation.licServer'),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      json: {serialNo: serialNumber},
      resolveWithFullResponse: true
    };
    try {
      const response = await request(options);
      const body = response.body;
      let activationDate = configService.get("licenseActivation.activatedOn");
      if (body.signature != false) {
        if (activationDate) {
          configService.remove("licenseActivation.activatedOn");
        }
        if (configService.get("licenseActivation.lastWarningDate")) {
          configService.remove("licenseActivation.lastWarningDate");
        }
        configService.addMultiple({
          "licenseActivation.data.activated": body.activated,
          "licenseActivation.data.txID": body.txID,
          "licenseActivation.data.signature": body.signature,
          "licenseActivation.data.timestamp": body.timestamp
        });
        logger.info('Success: Post to LIC server');
        return body;
      }
      throw Error('LIC server returned signature false');
    } catch (error) {
      logger.info(`Connection to LIC server returned: ${error}`);
      throw error;
    }
  }

  /**
  * Date checker to evaluate time period of 30 days
  *
  * @method dateCheck
  * @param {Date} date date
  * @return {object} trailPeriod  and isValid
  */
  function dateCheck(date) {
    let timebe = moment(date).startOf('day');
    let datenow = moment(Date.now()).startOf('day');
    let diffDays = datenow.diff(timebe, 'days');
    if (diffDays < 30) {// test points
      return {
        trailPeriod: (period - diffDays),
        isValid: true
      };
    }
    logger.error(i18n.__(`0003 : Please activate your license now. The ${period}-day period has ended`));
    return {
      isValid: false
    };
  }

  /**
    * validator to filter log messages during datecheck and display them only to admin roles once per day
    *
    * @method writeLogs
    * @param {String} trailPeriod trial period
    * @param {String} isAdmin if Admin role or not
    * @param {String} logintime if user logged in or not
    */
  function writeLogs(trailPeriod, isAdmin, logintime) {
    let lastWarningDate = configService.get("licenseActivation.lastWarningDate");
    let lastDate = (lastWarningDate) ? moment(lastWarningDate).startOf('day') : undefined;
    let datenow = moment().startOf('day');
    let differDays = (lastWarningDate) ? datenow.diff(lastDate, 'days') : undefined;
    if (isAdmin && differDays != 0) {
      configService.add("licenseActivation.isWarningSet", false);
      if (!logintime && trailPeriod) logger.info(i18n.__('Please activate your license within "%d" days', trailPeriod));
      if (logintime && !configService.get("licenseActivation.isWarningSet")) {
        if (trailPeriod) logger.info(i18n.__('Please activate your license within "%d" days', trailPeriod));
        configService.add("licenseActivation.isWarningSet", true);
        configService.add("licenseActivation.lastWarningDate", Date.now());
      }
    }
  }

  /**
  * Adds licenseActivationDate property in config.json when there is any error in reaching LIC server
  *
  * @method addLicensedate
  * @return {object} trailPeriod  and isValid
  */
  function addLicensedate() {
    let licenseActivation = configService.get("licenseActivation.data");
    let activationDate = configService.get("licenseActivation.activatedOn");
    if (licenseActivation)
      configService.remove("licenseActivation.data");
    if (!activationDate) {
      configService.add("licenseActivation.activatedOn", Date.now());
      return {trailPeriod: period, isValid: true};
    }
    let dateCheckData = dateCheck(activationDate);
    if (dateCheckData.isValid) {
      return {trailPeriod: dateCheckData.trailPeriod, isValid: true};
    }
    throw (new Error('License Activation check Failed'));
  }

  /**
  * Wrapper function for retrieveLicenseParameters
  *
  * @method retrieveLicenseParametersP
  * @return {promise} resolve when retuned License Serial Number
  */
  function retrieveLicenseParametersP() {
    return new Promise(resolve => {
      const license = new License(configService.configFilePath, i18n);
      license.retrieveLicenseParameters(configService, resolve);
    });
  }
  module.exports = {postToLICServer, checkLicenseActivationOnLogin, checkLicenseOnStart, signatureVerification};
})();

