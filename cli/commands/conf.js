'use strict';
const fs = require('fs-extra');
const configService = require('ng-configservice');
const commands = require('./configure');
const logger = require('log4js').getLogger('commands.conf');
const path = require('path');
const LoopbackConfigService = require('../../server/backend/LoopbackConfigService');

configService.read('config/server/config.json');
/**
 * creates all required files for starting the server
 * @param {object}  argv - The object instance of the type ARGV
 * @param {object}  result - The object instance of the result
 * @param {object}  i18n - The object instance of type i18n
 */
function command(argv, result, i18n) {
  logger.trace(i18n.__('executing :'));

  createFolder(path.join(__dirname, "..", "..", "config"));
  createFolder(path.join(__dirname, "..", "..", "plugins"));
  createFolder(path.join(__dirname, "..", "..", "log"));
  createFolder(path.join(__dirname, "..", "..", "config/licenses"));
  createFolder(path.join(__dirname, "..", "..", "config/docs"));
  createFolder(path.join(__dirname, "..", "..", "config/server"));
  createFolder(path.join(__dirname, "..", "..", "config/plugins"));

  fs.copySync(path.join(__dirname, "..", "..", "scripts", "component-config.json"), path.join(__dirname, "..", "..",
    "config", "component-config.json"));

  configServer(argv, configService, i18n);
}

/**
 * Get the Process ID pid out of the string
 * @param  {object} argv command line arguments
 * @param  {object} configService representation of the cobfigService
 * @param {object}  i18n - The object instance of type i18n
 * @return {Promise}          false or true
 */
async function configServer(argv, configService, i18n) {
  try {
    let result;
    result = await commands.prompt.get(argv, configService, i18n);
    await commands.configConfig.create(configService, result, i18n);
    await commands.log4js.create(configService);
    await commands.datasources.create(configService);
    await configService.stopWatching();
    configService = new LoopbackConfigService(i18n, configService);
    await configService.init();
    await commands.componentConfig.create(configService);
    await commands.configDb.create(result, configService);
    await commands.serverConfig.create(configService);
    await commands.aws.init(configService);
    await commands.keys.generate(configService);
    logger.info(i18n.__('System successfully configured'));
    process.exit(0);
  } catch (err) {
    if (err) return logger.error(i18n.__('Error:'), err);
    logger.info(i18n.__('Cancelled'));
    process.exit(0);
  }
}

/**
 * Create a folder on teh filesystem
 * @param  {string} folder Folder name to be creates
 */
function createFolder(folder) {
  try {
    fs.lstatSync(folder);
  } catch (e) {
    fs.mkdirSync(folder);
  }
}

module.exports = command;
