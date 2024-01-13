'use strict';
const fs = require('fs-extra-promise');
const path = require('path');
const nconf = require('nconf');
const Promise = require("bluebird");
const userHome = require('user-home');

const fileExists = require('file-exists');

const argv = require('minimist')(process.argv.slice(2));
const configFileName = argv['config-file'] || 'config.json';
const baseDir = require('ng-rt-dev-tools').baseDir;
const sourceConfigFilePath = path.join(baseDir, 'script', configFileName);
const configPath = path.join(userHome, '.project', configFileName);

const logger = require('log4js').getLogger('commands.configService');
/**
 * Unwatch the file from configPath
 * Watch for changes on `filename`. The callback `listener` will be called each time the file is accessed.
 */
function stopWatching() {
  fs.unwatchFile(configPath);
}

/**
 * Watch the file from configPath
 * Watch for changes on `filename`. The callback `listener` will be called each time the file is accessed.
 */
function startWatching() {
  fs.watchFile(configPath, () => {
    nconf.file({
      file: configPath
    });
  });
}

/**
 *
 * @param {object} path - path of the file to be added
 * @param {object} watch - watch flag as parameter
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
 *
 * @param {object} field - replace field value
 * @return {object} field - new field value after conversion
 */
function toNconf(field) {
  return field.replace(new RegExp("\\.", 'g'), ":");
}

/**
 *
 * @param {object} field - get the field/parameter value
 * @param {object} defaultValue - get default value/second parameter
 * @return {object} value - return value got from config
 */
function get(field, defaultValue) {
  var value = nconf.get(toNconf(field));
  if (typeof value === 'undefined')
    return defaultValue;
  return value;
}

/**
 *
 * @param {object} field - get the field/parameter value
 * @param {object} value - get default value/second parameter
 * @return {object} Promise - add value to configfile
 */
function add(field, value) {
  return new Promise(function(resolve, reject) {
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
 *
 * @param {object} conf - multiple value addition to config
 * @return {object} Promise - added values to configfile
 */
function addMultiple(conf) {
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
 *
 * @param {object} field - field value to be removed from config
 * @return {object} Promise - removed value from configfile
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
 * configservice init before using configservice in code
 */
function init() {
  if (!fileExists.sync(configPath)) {
    try {
      fs.copySync(sourceConfigFilePath, configPath);
    } catch (err) {
      logger.debug(err);
    }
  }
  nconf
    .env()
    .argv();

  reloadFile();
}

module.exports = {
  init,
  get,
  add,
  addMultiple,
  remove,
  stopWatching,
  config: nconf,
  configFilePath: configPath,
  reloadFile
};
