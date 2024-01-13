'use strict';

const createComponentConfig = require('./services/component_config');
const createDatasources = require('./services/datasources');
const createLog4js = require('./services/log4js');
const createServerConfig = require('./services/server_config');
const createConfigConfig = require('./services/config_config');
const getPrompt = require('./services/prompt');
const initAWS = require('./services/aws');
const keys = require('./services/keys');
const createDbConfig = require('./services/config_db');

module.exports = {
  aws: {
    init: initAWS
  },
  componentConfig: {
    create: createComponentConfig
  },
  datasources: {
    create: createDatasources
  },
  keys: {
    generate: keys
  },
  log4js: {
    create: createLog4js
  },
  configConfig: {
    create: createConfigConfig
  },
  prompt: {
    get: getPrompt
  },
  serverConfig: {
    create: createServerConfig
  },
  configDb: {
    create: createDbConfig
  }
};
