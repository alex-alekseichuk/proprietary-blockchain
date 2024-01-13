/**
 * Services manager with features:
 *   + multi-version: several implementations for the same API;
 *   + hot update of the service without process restart;
 *   + and transparently for the clients.
 *  It supports interface of pluginManager/service module.
 *  It may be used directly or as a part of IoC system.
 */
'use strict';
/* eslint-disable complexity */
const logger = require('log4js').getLogger('serviceManager');
const _services = {};

/**
 * API/Service/Service
 *
 * @module API/Service/Service
 * @type {object}
 */

/**
 * Register an object as implementation of a service
 * @param {object} info parameters of the service
 * @param {object} service implementation
 * @param {boolean} directly indicates direct reference to the service
 * @return {*} api service record
 */
function add(info, service, directly) {
  if (typeof info === "string") {
    info = {
      name: info
    };
  }
  if (!info.name) {
    logger.error("Trying to register service with no name.");
    return;
  }

  let serviceRecord = _services[info.name];

  // if service is already registered
  if (serviceRecord) {
    if (serviceRecord.__info.direct || info.direct || directly) {
      logger.error(`Can't redefine already registered service ${info.name}. New or old version is direct.`);
      return;
    }

    // update service implementation
    Object.setPrototypeOf(serviceRecord, service);
    return serviceRecord;
  }

  // service is not registered yet

  // register direct reference to the service
  if (info.direct || directly) {
    info.direct = true; // set by hand, if it was not set yet
    service.__info = info;
    _services[info.name] = service;
    _registerApi(info, service);
    return service;
  }

  // register proxy reference to the service
  serviceRecord = Object.create(service);
  serviceRecord.__info = info;
  _services[info.name] = serviceRecord;
  _registerApi(info, serviceRecord);
  return serviceRecord;
}

/**
 * Register a service as API.
 * @param {object} info parameters of the service
 * @param {object} service reference to implementation
 * @return {*} api service record
 * @private
 */
function _registerApi(info, service) {
  if (!info.api)
    return;

  let apiRecord = _services[info.api];

  // if api is already registered
  if (apiRecord) {
    if (apiRecord.__info.services) { // it's an api
      if (apiRecord.__info.services.indexOf(info.name) === -1) {
        // add service to the api
        apiRecord.__info.services.push(info.name);
      }
    } else { // it's not an api
      // turn it into api
      Object.setPrototypeOf(apiRecord, service);
      apiRecord.__info.services = [info.name];
    }
    return apiRecord;
  }

  // register new api
  apiRecord = Object.create(service);
  apiRecord.__info = {
    name: info.api,
    services: [info.name] // service name in the head of the list is default one for the api
  };
  _services[info.api] = apiRecord;
  return apiRecord;
}

/**
 * Remove service implementation.
 * @param {string} name name of the service/API
 */
function remove(name) {
  let service = _services[name];
  if (!service || // if name is not registered
      service.__info.direct || // or it's direct referenced service
      service.__info.services) { // or it's an api
    return; // then can't remove
  }

  delete _services[name];

  // remove service from api
  if (service.__info.api) {
    let api = _services[service.__info.api];
    if (!api || !api.__info.services) {
      return;
    }
    let services = api.__info.services;

    let index = services.indexOf(name);
    if (index === -1)
      return;
    services.splice(index, 1);

    // if we removed non-default implementation
    if (index !== 0) {
      // then just return
      return;
    }

    // as we removed default implementation,
    // set another implementation for api
    let anotherService;
    if (services.length > 0) {
      anotherService = _services[services[0]];
    }
    Object.setPrototypeOf(api, anotherService || {});
  }
}

/**
 * Setup default service of the api
 * @param {string|object} api target api
 * @param {string|object} service new default service
 */
function setDefault(api, service) {
  if (typeof api === 'string')
    api = _services[api];
  if (typeof service === 'string')
    service = _services[service];
  if (!api || !service || !api.__info.services) {
    return;
  }
  const services = api.__info.services;
  const index = services.indexOf(service.__info.name);

  if (index === -1 || // if there is no such service
    index === 0) { // or it's already default one in the api
    return; // do nothing
  }

  // actually set new default service for the api
  Object.setPrototypeOf(api, service);

  // move new default service name to the head of the services list
  const name = services[0];
  services[0] = services[index];
  services[index] = name;
}

module.exports = {
  add: add,
  addDirectly: (name, service) => add(name, service, true),
  get: name => _services[name],
  getOrCreate: name => _services[name] || add(name, {}),
  remove: remove,
  list: () => Object.keys(_services),
  setDefault: setDefault,
  listApiServices: name => {
    const api = _services[name];
    if (api && api.__info.services) {
      return api.__info.services;
    }
  }
};
