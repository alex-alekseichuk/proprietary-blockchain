'use strict';
const pointName = "route";
var logger = require('log4js').getLogger('entrypoint.route');

module.exports = function(points, configService) {
  points[pointName] = point;
  points[pointName + "_deactivate"] = repoint;

  /**
   * Entrypoint for http router
   * @param {string} plugin - plugin name
   * @param {object} parameters - entrypoint parameters
   * @param {object} server - instance of loopback application
   * @param {object} pluginInstance - insance of Plugin
   * @return {Promise} - Promise entrypoint for state machine
   */
  function point(plugin, parameters, server, pluginInstance) {
    return new Promise((resolve, reject) => {
      var fileName = parameters.file;
      var route = pluginInstance.storage.require(pluginInstance.name, fileName);
      logger.trace('entry point route', typeof route);
      let ret;
      if (typeof route === 'function')
        ret = route(server, pluginInstance.name, pluginInstance);
      if (typeof route === 'object' && route.activate)
        ret = route.activate(server, pluginInstance.name, pluginInstance);
      logger.trace('resolve');
      if (isPromise(ret))
        return ret.then(resolve).catch(reject);
      return resolve();
    });
  }

  /**
   * Remove entrypoint for http router
   * @param {string} plugin - plugin name
   * @param {object} parameters - entrypoint parameters
   * @param {object} server - instance of loopback application
   * @param {object} pluginInstance - insance of Plugin
   * @return {Promise} - Promise entrypoint for state machine
   */
  function repoint(plugin, parameters, server, pluginInstance) {
    return new Promise((resolve, reject) => {
      var fileName = parameters.file;
      var route = pluginInstance.storage.require(pluginInstance.name, fileName);
      logger.debug('switch off entry point route', typeof route);
      // if (typeof route === 'function')
      // route(server);
      let ret;
      if (typeof route === 'object' && route.deactivate) {
        if (typeof route.deactivate == 'function')
          ret = route.deactivate(server, pluginInstance.name);
        if (typeof route.deactivate === 'object')
          ret = deactivate(server, route.deactivate, pluginInstance.name);
      } else {
        logger.debug('no deactivate function');
        return reject('no deactivate function');
      }
      logger.debug('resolve');
      if (isPromise(ret))
        return ret.then(resolve).catch(reject);
      return resolve();
    });
  }
};

/**
 * Remove http routes
 * @param {object} server instance of application
 * @param {object} routes routes for remove
 * @param {string} pluginName name of plugin
 * @return {Promise} - promise from deactivate function
 */
function deactivate(server, routes, pluginName) {
  let deactivateCallback;
  Object.keys(routes).forEach(route => {
    if (route === 'deactivateCallback' && typeof routes[route] === 'function') {
      deactivateCallback = routes[route](server, pluginName);
      return;
    }
    var path = routes[route].path;
    var type = routes[route].type;
    if (removeRoute(server, path, type))
      logger.debug('route', route, 'deactivated');
  });
  return deactivateCallback;
}

/**
 * Remove http routes
 * @param {object} app instnace of application
 * @param {string} path route path
 * @param {string} type route method
 * @return {boolean} true if found and removed
 */
function removeRoute(app, path, type) {
  var found;
  var route;
  var stack;
  var idx;
  logger.debug('remove route ', path, type);
  found = findRoute(app, path, type);
  // logger.debug(found);
  if (found) {
    route = found.route;
    stack = found.stack;
    if (!route) return false;

    idx = stack.indexOf(route);
    logger.debug('remove', route);
    stack.splice(idx, 1);
    return true;
  }
  return false;
}

/**
 * Find route
 * @param {object} app instance of application
 * @param {string} path route path
 * @param {string} type route method
 * @return {object} instance of removed route, null if not founded
 */
function findRoute(app, path, type) {
  let route;
  let stack;

  stack = app._router.stack;

  /**
   * Find route
   * @param {*} path route path
   * @param {*} stack stack of application routes
   * @param {*} type route method
   */
  function _findRoute(path, stack, type) {
    stack.forEach(layer => {
      if (!layer) return;
      if (layer && !layer.match(path)) return;
      if (layer.path != path) return;
      if (['query', 'expressInit'].indexOf(layer.name) != -1) return;
      if (type && layer.route && layer.route.methods) {
        logger.debug('check type');
        if (type.toLowerCase() === 'get' && !layer.route.methods[type.toLowerCase()])
          return;
      }
      // logger.debug(layer);
      if (layer.name == 'router') {
        stack = layer.handle.stack;
        _findRoute(trimPrefix(path, layer.path));
      } else {
        logger.debug('found  for', path, layer, type);
        route = layer;
      }
    });
  }

  _findRoute(path, stack, type);

  if (!route) return null;
  return { route: route, stack: stack };
}

/**
 * trim prefix from path, assumes prefix is already at the start of path.
 * @param {string} path route path
 * @param {string} prefix preefix for trim
 * @return {string} trimed path
 */
function trimPrefix(path, prefix) {
  return path.substr(prefix.length);
}

/**
 * check object is promise
 * @param {object} obj object for check
 * @return {boolean} true if promise
 */
function isPromise(obj) {
  return Boolean(obj) && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}