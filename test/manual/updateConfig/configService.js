'use strict';
// original configService with changed path to config
/**
 * API/Service/ConfigService
 *
 * @module API/Service/ConfigService
 * @type {object}
 */
const fs = require('fs');
const path = require('path');
const nconf = require('nconf');

var configFileName = 'config.json';
var configPath = path.join(__dirname, configFileName);

nconf
  .env()
  .argv();

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

  nconf.file({
    file: path || configPath
  });

  if (watch)
    startWatching();
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
  var value = nconf.get(toNconf(field));
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
  // emitter.on('add', callback);
}

/**
 * add callback to 'addmultiple' event
 * @param {function} callback - function to fire
 */
function onaddmultiple(callback) {
  // emitter.on('addmultiple', callback);
}

reloadFile();

module.exports = {
  get: get,
  add: add,
  addMultiple: addMultiple,
  remove: remove,
  stopWatching: stopWatching,
  config: nconf,
  configFilePath: configPath,
  reloadFile: reloadFile,
  onadd: onadd,
  onaddmultiple: onaddmultiple
};
