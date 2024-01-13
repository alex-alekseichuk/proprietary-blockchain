'use strict';

const fs = require('fs-extra');
const toml = require('toml');
const fileExists = require('file-exists');
const path = require('path');
const logger = require('log4js').getLogger('utils.ini');

/**
 * Update environmnet varibales based on CLI command i.e. run, configure
 * @param {*} cliCommand cli command
 * @param {*} argv cli command
 * @return {*} argv updated argv array based on argv.toml
 */
function updateArgv(cliCommand, argv) {
  const argvFileName = 'argv.toml';
  const argvPath = '../config/server';
  var argvFilePath = path.join(__dirname, argvPath, argvFileName);

  if (fileExists.sync(argvFilePath)) {
    logger.warn('ARGV File does exist - overrding ARGV with argv.toml values ');
  } else {
    logger.warn('ARGV File does not - usig standard argv array');
    return;
  }

  try {
    const config = toml.parse(fs.readFileSync(argvFilePath, 'utf-8'));
    for (let name of Object.keys(config[cliCommand])) {
      logger.trace(name);
      if (typeof config[cliCommand][name] !== "undefined") {
        logger.trace('Name : ', name);
        [cliCommand][name] = config[cliCommand][name];
        logger.trace('Element : %s ', name, config[cliCommand][name]);
        argv[name] = config[cliCommand][name];
        logger.trace('argv.name : ', argv[name]);
      }
    }
  } catch (error) {
    logger.error('Invalid TOML');
  }
  return argv;
}

module.exports = {
  updateArgv
};
