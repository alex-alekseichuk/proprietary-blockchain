'use strict';
/* eslint-disable complexity */
const fs = require('fs');
const logger = require('log4js').getLogger('commands.services.config_config');
const path = require('path');
global.appBase = path.resolve(__dirname, "../../../../");

module.exports = async (promptResult, configService) => {
  logger.debug('Executing config_config.js');

  let configTemplateName;

  switch (promptResult.serverType) {
    case "Login":
      configTemplateName = 'config-login.json';
      break;
    case "App":
      configTemplateName = 'config-app.json';
      break;
    case "Full":
      configTemplateName = 'config-full.json';
      break;
    case "SC":
      configTemplateName = 'config-sc.json';
      break;
    case "Bc":
      configTemplateName = 'config-bc.json';
      break;
    default:
  }

  switch (promptResult.serverTypeSingleConfig) {
    case "D":
      configTemplateName = 'config-demo.json';
      break;
    case "F":
      configTemplateName = 'config-full.json';
      break;
    case "M":
      configTemplateName = 'config-minimal.json';
      break;
    case "B":
      configTemplateName = 'config-bootable.json';
      break;
    default:
      configTemplateName = 'config-full.json';
  }

  let path = require("path");
  let scripts = "../../../../scripts";
  let configTemplatePath = path.join(__dirname, scripts, configTemplateName);
  let configTemplate = fs.readFileSync(configTemplatePath, "utf8");
  configTemplate = JSON.parse(configTemplate);

  configTemplate.namespace = promptResult.namespace;
  configTemplate.databaseType = promptResult.databaseType;
  configTemplate.primaryBlockchainProvider = promptResult.primaryBlockchainProvider;
  if (promptResult.primaryBlockchainProvider == 'B') {
    configTemplate.primaryBlockchainProviderVersion = promptResult.bigchaindbVersion;
    configTemplate.bigchainMongoDBHost = promptResult.BigchainDB_defaultDS_IP_Address;
    configTemplate.bigchainMongoDBPort = promptResult.BigchainDB_defaultDS_Port;
    configTemplate.datasources.dsBigchainMongo = {
      factory: "mongoDb",
      url: `mongodb://${promptResult.BigchainDB_defaultDS_IP_Address}:${promptResult.BigchainDB_defaultDS_Port}`
    };
  }
  if (promptResult.primaryBlockchainProvider == 'I') {
    configTemplate.primaryBlockchainProviderVersion = promptResult.iotaVersion;
  }
  if (promptResult.primaryBlockchainProvider == 'T') {
    configTemplate.primaryBlockchainProviderVersion = promptResult.projectVersion;
  }
  configTemplate.serverEnvironment = promptResult.serverEnvironment;
  configTemplate.blockchainClusterId = promptResult.blockchainClusterId;
  configTemplate.clusterId = promptResult.clusterId;
  configTemplate.envId = promptResult.envId;
  configTemplate.tendermintHost = promptResult.Tendermint_IP_Address;
  configTemplate.tendermintPort = promptResult.Tendermint_Port;
  configTemplate.log4jsMongoHost = promptResult.log4jsDB_IP_Address;
  configTemplate.log4jsMongoPort = promptResult.log4jsDB_Port;
  configTemplate.ngrtStatsdHost = promptResult.StatsD_IP_Address;
  configTemplate.ngrtStatsdPort = promptResult.StatsD_Port;
  configTemplate.messagingHost = promptResult.Messaging_IP_Address;
  configTemplate.messagingPort = promptResult.Messaging_Port;
  configTemplate.messagingAdmin = promptResult.Messaging_Admin;
  configTemplate.ngrtStatsdAdminPort = promptResult.StatsD_Admin_Port;
  configTemplate.smartContractsHost = promptResult.SC_IP_Address;
  configTemplate.dockerAdminPort = promptResult.dockerAdminPort;
  configTemplate.smartContractsPort = promptResult.SC_Port;
  configTemplate.ngrtPort = promptResult.NGRT_Port;
  configTemplate.instanceId = promptResult.instanceId;
  configTemplate.tenantId = promptResult.tenantId;
  configTemplate.defaultDomainId = promptResult.defaultDomainId;
  configTemplate.jwtAuthClusterId = promptResult.jwtAuthClusterId;
  configTemplate.jwtAuthInstanceId = promptResult.jwtAuthInstanceId;
  configTemplate.jwtAuthTenantId = promptResult.jwtAuthTenantId;
  configTemplate.nodeRedPort = promptResult.NODE_RED_Port;
  configTemplate.publicDNSName = promptResult.Public_Host;
  configTemplate.internalDNSName = promptResult.internalDNSName;
  configTemplate.https = promptResult.https;
  configTemplate.jwt.secret = promptResult.JWT_PROJECT_SECRET;
  configTemplate.autoUpdate.active = promptResult.autoUpdate;
  configTemplate.createDefaultUsers = promptResult.createDefaultUsers;

  if (promptResult.serverDeployment == 'Distributed') {
    if (promptResult.serverType == 'Login') {
      configTemplate.servers["ng-rt-admin"] = promptResult.ng_rt_admin;
      configTemplate.servers["ng-rt-jwt-auth"] = promptResult.ng_rt_jwt_auth;
    }
    if (promptResult.serverType == 'App') {
      configTemplate.servers["ng-rt-jwt-auth"] = promptResult.ng_rt_jwt_auth;
    }
  }

  configTemplate.datasources.mongoDB.host = promptResult.defaultDS_IP_Address;
  configTemplate.datasources.mongoDB.port = promptResult.defaultDS_Port;

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

  await configService.addMultiple(configTemplate);
  return true;
};
