/* eslint no-unused-vars: ["error", { "vars": "local" }] */
'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('log4jsService');
const path = require('path');
const fs = require('fs-extra');
const fileExists = require('file-exists');
const contextService = require('./context');

let log4jsFilePath;
let config;
let defaultConfig = {
  appenders: {
    console: {
      type: "console"
    }
  },
  categories: {
    default: {
      appenders: [
        "console"
      ],
      level: "info"
    }
  }
};

const configure = () => {
  if (fileExists.sync(log4jsFilePath)) {
    try {
      config = JSON.parse(fs.readFileSync(log4jsFilePath).toString());
    } catch (e) {
    }
  }
  if (!config)
    config = defaultConfig;

  const layout = {
    type: 'pattern',
    pattern: '%[[%d] %p %c%] %x{clientId}:%x{sessionId}:%x{requestId} %m',
    tokens: {
      clientId: () => (contextService.get('clientId') || '-'),
      sessionId: () => (contextService.get('sessionId') || '-'),
      requestId: () => (contextService.get('requestId') || '-')
    }
  };
  Object.keys(config.appenders).forEach(key => {
    config.appenders[key].layout = layout;
  });

  log4js.configure(config);
  logger.debug('log4jsService configured');
};

const init = (projectBaseDir = process.cwd()) => {
  log4jsFilePath = path.join(projectBaseDir, "config", "server", "log4js.json");
  if (fileExists.sync(log4jsFilePath)) {
    const config = require(log4jsFilePath);
    if (config.categories && config.categories.default)
      config.categories.default.level = process.env.serverLogLevel || config.categories.default.level || 'debug';
    fs.writeFileSync(log4jsFilePath, JSON.stringify(config, null, 2));
  }
  configure();
};

const get = field => {
  return config[field];
};
const getLogLevel = () => {
  if (config && config.categories && config.categories.default && config.categories.default.level)
    return config.categories.default.level;
  return '';
};

const update = (valueObj = {}) => {
  config = Object.assign(config, valueObj);
  if (fileExists.sync(log4jsFilePath)) {
    fs.writeFileSync(log4jsFilePath, JSON.stringify(config, null, 2));
  }
  configure();
};
const updateLogLevel = level => {
  if (config && config.categories && config.categories.default) {
    config.categories.default.level = level;
    if (fileExists.sync(log4jsFilePath)) {
      fs.writeFileSync(log4jsFilePath, JSON.stringify(config, null, 2));
    }
    configure();
  }
};

module.exports = {
  init,
  get,
  update,
  updateLogLevel,
  getLogLevel
};
