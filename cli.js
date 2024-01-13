#! /usr/bin/env node
/* eslint-disable no-console */
/**
 * 
 * @desc Command line interface for ng-rt
 * @version 3.0
 * 
 */

'use strict';

const result = require("./cli/result");
var argv = require('minimist')(process.argv.slice(2));
const i18n = require('i18n');
const path = require('path');
const configService = require('ng-configservice');
const log4jsService = require('./server/backend/log4jsService');
const fileExists = require('file-exists');
const help = require('./cli/commands/help');
const argvBasedOnToml = require('./utils/ini');
const iniService = require('./server/backend/iniService');

configService.read('config/server/config.json');

var commands = {
  "configure": require("./cli/commands/conf"),
  "copyright": require("./cli/commands/copyright"),
  "info": require("./cli/commands/info"),
  "init": require("./cli/commands/init"),
  "isonline": require("./cli/commands/isonline"),
  "run": require("./cli/commands/run"),
  "show-pubkey": require("./cli/commands/showpubkey"),
  "show-config": require("./cli/commands/showconfig"),
  "stop": require("./cli/commands/stop"),
  "test-connectivity": require("./cli/commands/testconnectivity"),
  "version": require("./cli/commands/version"),
  "help": help.show
};

// initialze multilingual support for server side string translation
var localFolder = path.join(__dirname, iniService.get('i18n:localesPath'));
if (configService.get('i18n')) {
  i18n.configure(configService.get('i18n'));
} else {
  // use default settings
  i18n.configure({
    locales: ['en', 'de', 'ru'],
    directory: localFolder,
    defaultLocale: 'en',
    register: global
  });
}

log4jsService.init(__dirname);

// update argv based on argv.toml and cli command i.e. run, init
const argvFileName = iniService.get('argv:fileName');
const argvFilePath = iniService.get('argv:filePath');
const argvFileNamePath = path.join(__dirname, ".", argvFilePath, argvFileName);
// argv overrides from user
if (fileExists.sync(argvFileNamePath)) {
  argv = argvBasedOnToml.updateArgv(process.argv[2], argv);
}

// check valid license file
const licenseFileName = iniService.get('license:fileName');
const licenseFilePath = iniService.get('license:filePath');
const licenseFileNamePath = path.join(__dirname, ".", licenseFilePath, licenseFileName);
if (typeof argv.skiplicense === 'undefined' || !argv.skiplicense) {
  if (!fileExists.sync(licenseFileNamePath)) {
    console.log(i18n.__('0004 : no license file in folder %s found', iniService.get('license:filePath')));
    process.exit(1);
  }
}

var command = commands[process.argv[2]];

if (command) {
  if (argv.h || argv.help) {
    help.show();
    process.exit(1);
  } else {
    commands[process.argv[2]](argv, result, i18n);
  }
} else {
  help.show();
  process.exit(1);
}
