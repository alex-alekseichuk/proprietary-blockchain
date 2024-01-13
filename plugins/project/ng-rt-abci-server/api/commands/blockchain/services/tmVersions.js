'use strict';

const logger = require('log4js').getLogger('commands.blockchain.dataService.checkTmVersion');
const semver = require('semver');

module.exports = {
  checkTmVersion
};

/**
 * Checks the requested TM Version compatibility with the supported version in the abci app
 * @param {Object} currentVersion requested version of TM
 * @param {Array} supportedTmVersions Tendermint Versions supported by ng-rt-abci-server
 * @return {boolean} True/False condition result
 */
function checkTmVersion(currentVersion, supportedTmVersions) {
  try {
    if (supportedTmVersions.length > 0) {
      logger.debug('Supported versions :', JSON.stringify(supportedTmVersions, null, 2), 'Requested Tendermint version:', currentVersion.version);
      return supportedTmVersions.some(item => {
        return semver.diff(currentVersion.version, item.version) === 'minor' || "prepatch" && semver.gte(currentVersion.version, item.version);
      });
    }
    return true;
  } catch (error) {
    logger.error('error in checking TM version', error.message);
    return false;
  }
}
