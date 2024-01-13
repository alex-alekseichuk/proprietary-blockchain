'use strict';

const logger = require('log4js').getLogger('services.storageProviders');

 /**
  * API/Service/StorageProviders
  *
  * @module API/Service/StorageProviders
  * @type {object}
  */

const storageProviders = {};

/**
 * Register storage provider
 * @param  {string} name     Name
 * @param  {object} provider Storage provider
 * @param  {Object} settings Settings
 */
const register = function(name, provider, settings) {
  storageProviders[name] = settings ? provider(settings) : provider;
  logger.debug('StorageProvider ' + name + ' registered', settings);
};

/**
 * Get storage provider by name
 * @param  {string} name Name
 * @return {object}      Storage provider
 */
const get = function(name) {
  return storageProviders[name];
};

/**
 * Remove storage provider by name
 * @param  {string} name Name
 */
const remove = function(name) {
  storageProviders[name] = null;
  delete storageProviders[name];
};

/**
 * Get list of storage providers
 * @return {array} List of storage providers
 */
const getList = function() {
  return Object.keys(storageProviders);
};

module.exports = {
  register: register,
  get: get,
  remove: remove,
  getList: getList
};
