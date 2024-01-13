/**
 * IoC container.
 */
'use strict';
const logger = require('log4js').getLogger('ioc');
const _ = require('lodash');
let services;

/**
 * API/Service/IOC
 *
 * @module API/Service/IOC
 * @type {object}
 */

const componentName = factory => Array.isArray(factory.__components)
  ? factory.__components.join(',') : factory.__components;

const _register = (path, factory, instance) => {
  if (!factory.__components)
    return;

  // single component
  if (!Array.isArray(factory.__components)) {
    services.add(factory.__components, instance);
    return;
  }

  // register several service implementations
  _.forEach(factory.__components, record => {
    const key = (typeof record === 'string') ? record : (record.key || record.name);
    const implementation = instance[key];
    if (implementation) {
      services.add(record, implementation);
    } else {
      logger.error(`IoC can't find ${key} component in ${path} module.`);
    }
  });
};

/**
 * Loads module, instantiate it with all dependencies, then register all services.
 * Module should be an instance object or a factory function to be called to build such instance.
 * There are optional properties:
 * __dependencies is an array of services this module needs.
 * __components is an array of services names, that module implements.
 * @param {string} path is a path to the module file.
 * @return {Promise} instance of the module or undef if there is an error.
 */
const load = path => {
  const factory = require(path);
  let instance;

  if (typeof factory === 'function') {
    // compose dependencies for the module
    let dependencies;
    if (factory.__dependencies) {
      let dependencyOk = true;
      dependencies = _.map(factory.__dependencies, dependencyRecord => {
        if (typeof dependencyRecord === 'string') {
          dependencyRecord = {
            name: dependencyRecord
          };
        }
        let dependency;
        if (dependencyRecord.check) {
          dependency = services.get(dependencyRecord.name);
          if (!dependency) {
            logger.error(`IoC can't find ${dependencyRecord.name} as dependency for ${path} module.`);
            dependencyOk = false;
          }
        } else {
          dependency = services.getOrCreate(dependencyRecord.name);
        }
        return dependency;
      });
      if (!dependencyOk) {
        return Promise.reject();
      }
    }

    // instantiate
    instance = factory.apply(factory, dependencies);

    // if factory returns a promise
    if (typeof instance.then === 'function') {
      // return instance;
      return instance.then(instance => {
        if (instance) {
          _register(path, factory, instance);
          return Promise.resolve(instance);
        }
        return Promise.reject(componentName(factory));
      });
    }
  } else {
    // assume that the module exports an object instead of factory function
    instance = factory;
  }

  if (instance) {
    _register(path, factory, instance);
    return Promise.resolve(instance);
  }
  return Promise.reject(componentName(factory));
};

module.exports = _services => {
  services = _services;
  return {
    load: load
  };
};
