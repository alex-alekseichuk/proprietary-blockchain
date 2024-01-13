"use strict";

/**
 * get storage provider by provided name, or returns a list of available providers
 */

/**
 *
 * @type {service}
 * @param {Object} services - services
 * @param {String} provider - provider's name
 * @return {Object} provider or list of providers
 */
module.exports = (services, provider) => {
  const storageProvidersService = services.get('storageProviders');

  return provider ? storageProvidersService.get(provider) : storageProvidersService.getList();
};
