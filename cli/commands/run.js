'use strict';
const npmi = require('npmi');
const log4js = require("log4js");
const logger = log4js.getLogger('commands.run');
const path = require("path");
const fs = require('fs-extra');
const iniService = require('../../server/backend/iniService');

/**
 * install npm
 * @return {Promise} promise
 */
const npmInstall = () => new Promise((resolve, reject) => {
  logger.debug("Npm install", path.resolve("./"));
  npmi({}, (err, result) => {
    if (err) return reject(err);
    logger.debug("NPM installed", result);
    resolve(result);
  });
});

/**
 * creates all required files for starting the server
 * @param {object}  argv - The object instance of the type ARGV
 * @param {object}  result - The object instance of the result
 * @param {object}  i18n - The object instance of i18n
 * @return {Promise} resolves when server started
 */
function command(argv, result, i18n) {
  createFolder(path.join(__dirname, "..", iniService.get('core:dirConfig')));
  createFolder(path.join(__dirname, "..", iniService.get('core:dirPlugins')));
  createFolder(path.join(__dirname, "..", iniService.get('core:dirLog')));
  createFolder(path.join(__dirname, "..", iniService.get('core:dirConfigLicenses')));
  createFolder(path.join(__dirname, "..", iniService.get('core:dirConfigData')));
  createFolder(path.join(__dirname, "..", iniService.get('core:dirConfigDocs')));
  createFolder(path.join(__dirname, "..", iniService.get('core:dirConfigServer')));
  createFolder(path.join(__dirname, "..", iniService.get('core:dirConfigPlugins')));

  const server = require("../../server/server.js");
  if (argv.npm) {
    return npmInstall().then(() => {
      return server.start(i18n, argv);
    });
  }
  return server.start(i18n, argv);
}

/**
 * Creates a new folder
 * @param {string} folder - The name of the folder to be created
 */
function createFolder(folder) {
  try {
    fs.lstatSync(folder);
  } catch (e) {
    fs.mkdirSync(folder);
  }
}

module.exports = command;
