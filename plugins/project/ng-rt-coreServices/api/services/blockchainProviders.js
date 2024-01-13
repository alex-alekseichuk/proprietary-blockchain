'use strict';

var logger = require('log4js').getLogger('services.blockchainProviders');

/**
 * API/Service/BlockchainProviders
 *
 * @module API/Service/BlockchainProviders
 * @type {object}
 */

var blockchainProviders = {};

/**
 * Register blockchain provider
 * @param  {string} name     Name
 * @param  {object} provider Blockchain provider
 * @param  {Object} settings Settings
 */
var register = function(name, provider) {
  blockchainProviders[name] = provider;
  logger.debug('blockchainProvider ' + name + ' registered');
};

/**
 * Get blockchain provider by name
 * @param  {string} name Name
 * @return {object}      Blockchain provider
 */
var get = function(name) {
  return blockchainProviders[name];
};

/**
 * Remove blockchain provider by name
 * @param  {string} name Name
 */
var remove = function(name) {
  blockchainProviders[name] = null;
  delete blockchainProviders[name];
};

 /**
  * Get list of blockchain providers
  * @return {array} List of blockchain providers
  */
var getList = function() {
  return Object.keys(blockchainProviders);
};

module.exports = {
  register: register,
  get: get,
  remove: remove,
  getList: getList
};
