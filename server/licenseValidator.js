'use strict';
const logger = require('log4js').getLogger('server/licenseValidator');
const coreVersion = require('../manifest.json').version ? require('../manifest.json').version : 'n.a';

/**
 *
 * @param {string} licenseVersion the complete license data
 * @return {boolean} if valid or not
 * @description Three cases which return true
 * 1. if licenseVersion is x.x, return true
 * 2. if licenseVersion is 1.x or 2.x, return true only if the major version of core is 1 or 2
 * 3. if licenseVersion is 1.6 or 2.1, return true if exact coreVersion matches
 */
const versionValidate = licenseVersion => {
  // first case
  if (licenseVersion === "x.x")
    return true;
  // second case. Verify major version number and return
  if (licenseVersion.substring(licenseVersion.length - 1)) {
    if (licenseVersion.charAt(0) === coreVersion.charAt(0))
      return true;
    logger.error("This license is not valid for current major system version");
  }
  // Third case. Only exact match returns true
  if (licenseVersion === coreVersion)
    return true;
  return false;
};

module.exports = {
  versionValidate
};
