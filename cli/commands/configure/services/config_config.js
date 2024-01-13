'use strict';
/* eslint-disable complexity */
const fs = require('fs');
const logger = require('log4js').getLogger('commands.services.config_config');
const path = require('path');
global.appBase = path.resolve(__dirname, "../../../../");

module.exports = async (configService, promptResult, i18n) => {
  logger.debug('Executing config_config.js');
  let configPath = configService.configFilePath;
  let configTemplate = {
    datasources: {
      default: {}
    }
  };
  configTemplate.databaseType = promptResult.databaseType;
  if (promptResult.primaryBlockchainProvider == 'B') {
    configTemplate.bigchainMongoDBHost = promptResult.BigchainDB_defaultDS_IP_Address;
    configTemplate.bigchainMongoDBPort = promptResult.BigchainDB_defaultDS_Port;
    configTemplate.datasources.dsBigchainMongo = {
      factory: "mongoDb",
      url: `mongodb://${promptResult.BigchainDB_defaultDS_IP_Address}:${promptResult.BigchainDB_defaultDS_Port}`
    };
  }

  configTemplate.serverEnvironment = promptResult.serverEnvironment;
  configTemplate.blockchainClusterId = promptResult.blockchainClusterId;
  configTemplate.clusterId = promptResult.clusterId;
  configTemplate.envId = promptResult.envId;
  configTemplate.instanceId = promptResult.instanceId;
  configTemplate.tenantId = promptResult.tenantId;
  configTemplate.defaultDomainId = promptResult.defaultDomainId;
  configTemplate.jwtAuthClusterId = promptResult.jwtAuthClusterId;
  configTemplate.jwtAuthInstanceId = promptResult.jwtAuthInstanceId;
  configTemplate.jwtAuthTenantId = promptResult.jwtAuthTenantId;
  configTemplate.serverDeployment = promptResult.serverDeployment;
  configTemplate.serverType = promptResult.serverType;

  if (promptResult.databaseType === 'mongodb') {
    configTemplate.datasources.mongoDB = {
      host: promptResult.defaultDS_IP_Address,
      port: promptResult.defaultDS_Port
    };
  }

  configTemplate.datasources.default.connector = promptResult.databaseType;
  configTemplate.datasources.default.host = promptResult.defaultDS_IP_Address;
  if (promptResult.defaultDS_Port)
    configTemplate.datasources.default.port = promptResult.defaultDS_Port;
  if (typeof promptResult.defaultDS_User === 'string' || promptResult.defaultDS_User instanceof String)
    configTemplate.datasources.default.user = promptResult.defaultDS_User;
  if (typeof promptResult.defaultDS_Password === 'string' || promptResult.defaultDS_Password instanceof String)
    configTemplate.datasources.default.password = promptResult.defaultDS_Password;
  if (typeof promptResult.defaultDS_Database === 'string' || promptResult.defaultDS_Database instanceof String)
    configTemplate.datasources.default.database = promptResult.defaultDS_Database;
  if (typeof promptResult.defaultDS_Schema === 'string' || promptResult.defaultDS_Schema instanceof String)
    configTemplate.datasources.default.schema = promptResult.defaultDS_Schema;
  if (typeof promptResult.defaultDS_ConnectionTimeout === 'number' || promptResult.defaultDS_ConnectionTimeout instanceof Number)
    configTemplate.datasources.default.connectionTimeout = promptResult.defaultDS_ConnectionTimeout;
  if (typeof promptResult.operationTimeout === 'number' || promptResult.operationTimeout instanceof Number)
    configTemplate.datasources.default.operationTimeout = promptResult.defaultDS_OperationTimeout;
  if (typeof promptResult.defaultDS_ReadTimeout === 'number' || promptResult.defaultDS_ReadTimeout instanceof Number)
    configTemplate.datasources.default.readTimeout = promptResult.defaultDS_ReadTimeout;
  if (typeof promptResult.defaultDS_hanaEndpoint === 'string' || promptResult.defaultDS_hanaEndpoint instanceof String)
    configTemplate.datasources.default.endpoint = promptResult.defaultDS_hanaEndpoint;

  configTemplate = JSON.stringify(configTemplate, null, "\t");

  fs.writeFileSync(configPath, configTemplate);

  configService.reloadFile(null, true);
  configService.stopWatching();

  return true;
};
