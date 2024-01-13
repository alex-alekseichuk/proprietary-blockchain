'use strict';
/**
 * API/Service/ConfigService
 *
 * @module API/Service/ConfigService
 * @type {object}
 */
const fs = require('fs');
const path = require('path');
const nconf = require('nconf');
const EventEmitter = require('events').EventEmitter;
const logger = require('log4js').getLogger('ng-configService');

var configFileName = 'config.json';

// ToDo has to be parameter from calling program
var configPath = path.join(__dirname, '..', '..', 'config', 'server', configFileName);

nconf
  .env()
  .argv();

let emitter = new EventEmitter();

/**
 * API/Service/ConfigService
 *
 * @module API/Service/ConfigService
 * @type {object}
 */

/**
 *  stop watch to changes on config.json file
 */
function stopWatching() {
  fs.unwatchFile(configPath);
}

/**
 * start watching to changes on config.json file
 */
function startWatching() {
  fs.watchFile(configPath, () => {
    nconf.file({
      file: configPath
    });
  });
}

/**
 * reload nconf and set config file
 * @param { string } path - path to config file
 * @param { boolean } watch - if true start watching to file
 */
function reloadFile(path, watch) {
  stopWatching();
  let fileName = path;
  let store;
  if (typeof path === 'object' && path !== null) {
    fileName = path.file;
    store = path.store;
  }
  let options = {
    file: fileName || configPath
  };
  if (store)
    nconf.file(store, options);
  else
    nconf.file(options);

  if (watch)
    startWatching();
}

/**
 * sync nconf with environment variables
 */
function syncEnv() {
  nconf.env();
}

/**
 * convert deep object field name to nconf syntax
 * @param { string } field - field name
 * @return { string } - converted field name
 */
function toNconf(field) {
  return field.replace(new RegExp("\\.", 'g'), ":");
}

/**
 * get value from config
 * @param {string} field - field name
 * @param {string} defaultValue - default value if no field in config
 * @return  {string} - field value
 */
function get(field, defaultValue) {
  let value = nconf.get(toNconf(field));
  try { // try to parse array or object from value
    value = JSON.parse(value);
  } catch (e) {
  }
  if (typeof value === 'undefined')
    return defaultValue;
  return value;
}

/**
 * add or set value in config
 * @param {string} field - field name
 * @param {*} value - value of config
 * @param {boolean} hidden - if true don't emit event about value changed
 * @return {Promise} result - true if value was changed
 */
function add(field, value, hidden) {
  return new Promise(function(resolve, reject) {
    let oldValue = get(field);
    if (oldValue === value)
      return resolve();
    nconf.set(toNconf(field), value);
    nconf.save(function(err) {
      if (err) {
        return reject(new Error(err));
      }
      if (!hidden)
        emitter.emit('add', {field: field, value: value});
      resolve(true);
    });
  });
}

/**
 * add or set as value in config multiple objec
 * @param {object} conf - value
 * @param {boolean} hidden - if true don't emit event about value changed
 * @return {Promise} result - true if value was changed
 */
function addMultiple(conf, hidden) {
  return new Promise(function(resolve, reject) {
    Object.keys(conf).forEach(function(field) {
      nconf.set(toNconf(field), conf[field]);
    });
    nconf.save(function(err) {
      if (err) {
        return reject(new Error(err));
      }
      if (!hidden)
        emitter.emit('addmultiple', conf);
      resolve(true);
    });
  });
}

/**
 * remove field from config
 * @param {string} field - field name
 * @return {Promise} result -  true if field removed
 */
function remove(field) {
  return new Promise(function(resolve, reject) {
    nconf.clear(toNconf(field));
    nconf.save(function(err) {
      if (err) {
        return reject(new Error(err));
      }
      resolve(true);
    });
  });
}

/**
 * add callback to 'add' event
 * @param {function} callback - function to fire
 */
function onadd(callback) {
  emitter.on('add', callback);
}

/**
 * add callback to 'addmultiple' event
 * @param {function} callback - function to fire
 */
function onaddmultiple(callback) {
  emitter.on('addmultiple', callback);
}

/**
 * check for existing config file
 * @param {string|object} path object or string of config file
 * @return {boolean} true if config file exist
 */
function checkPath(path) {
  let fileName = path;
  if (typeof path === 'object' && path !== null)
    fileName = path.file;
  return fs.existsSync(fileName);
}

/**
 * Full Path and file name to the config file
 * @param {*} path Full path of the config file incl name
 */
function read(path) {
  let fileName = path;
  if (typeof path === 'object' && path !== null)
    fileName = path.file;
  try {
    if (fs.existsSync(fileName)) {
      reloadFile(path);
    } else {
      logger.error('File %s does not exist', path);
    }
  } catch (err) {
    logger.error('Error :', err);
  }
}

/**
 * get config dump
 * @param {string} store - store name
 * @return  {object} - config dump
 */
function dump(store) {
  return nconf.stores[store].store;
}

// reloadFile();

module.exports = {
  get,
  add,
  addMultiple,
  remove,
  stopWatching,
  config: nconf,
  configFilePath: configPath,
  read,
  reloadFile,
  syncEnv,
  onadd,
  onaddmultiple,
  checkPath,
  dump
};
