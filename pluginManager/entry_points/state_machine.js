'use strict';
const pointName = "state_machine";
var logger = require('log4js').getLogger('entrypoint.state_machine');

module.exports = function(points, configService, filemanager) {
  points[pointName] = point;

  /**
   * Entrypoint for state machine
   * @param {string} plugin - plugin name
   * @param {object} parameters - entrypoint parameters
   * @param {object} server - instance of loopback application
   * @return {Promise} - Promise entrypoint for state machine
   */
  function point(plugin, parameters, server) {
    return new Promise((resolve, reject) => {
      logger.debug('entry point state machine', parameters);
      resolve();
    });
  }
};
