// import { request } from 'https';

/* eslint-disable no-console */

'use strict';
const logger = require('log4js').getLogger('helper');
const rp = require('request-promise');

const readinessCheck = {
  init: init
};

/**
 * init
 * @return {*} Boolean
 */
function init() {
  // let configService = require("../server/backend/configService");
  // let namespace = configService.get('namespace') ? configService.get('namespace') : "ng-rt-core";
  // let port = configService.get("ngrtPort");
  // let url = `http://localhost:${port}/${namespace}/readinesscheck`;
  let url = `http://localhost:8443/ng-rt-core/readinesscheck`;
  var options = {
    uri: url,
    resolveWithFullResponse: true
  };
  return rp(options)
    .then(function(response) {
      if (response && response.statusCode === 200) {
        logger.info("readiness success!");
        return true;
      }
      return false;
    })
    .catch(function(err) {
      return false;
    });
}

module.exports = readinessCheck;
