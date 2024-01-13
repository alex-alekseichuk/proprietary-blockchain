'use strict';
const configService = require('ng-configservice');
const log4js = require('log4js');
const logger = log4js.getLogger('commands.showconfig');
configService.read('config/server/config.json');
/**
 * creates all required files for starting the server
 * @param {object}  argv - The object instance of the type ARGV
 * @param {object}  result - The object instance of the result
 * @param {object}  i18n - The object instance of type i18n
 */
function command(argv, result, i18n) {
  logger.trace(i18n.__('executing :'));

  logger.info(i18n.__('Server Environment: %s', configService.get("serverEnvironment")));
  logger.info(i18n.__('Server Deployment : %s', configService.get("serverDeployment")));
  logger.info(i18n.__('System configuration :'));
  logger.info(i18n.__('Blockchain Cluster ID : %s', configService.get("blockchainClusterId")));
  logger.info(i18n.__('Cluster ID : %s', configService.get("clusterId")));
  logger.info(i18n.__('Instance ID : %s', configService.get("instanceId")));
  logger.info(i18n.__('Tenant ID : %s', configService.get("tenantId")));
  logger.info(i18n.__('JWT Instance ID : %s', configService.get("jwtAuthInstanceId")));
  logger.info(i18n.__('JWT Tenant ID : %s', configService.get("jwtAuthTenantId")));
  logger.info(i18n.__('The NGRT Port : %s', configService.get("ngrtPort")));
  logger.info(i18n.__('The Node-Red Port : %s', configService.get("nodeRedPort")));
  logger.info(i18n.__('Auto update: %s', configService.get("autoUpdate.active")));
  logger.info(i18n.__('The Public Hostname:Port : %s', configService.get("publicDNSName")));
  logger.info(i18n.__('The Mongo IP Address : %s', configService.get("datasource.mongoDB.host")));
  logger.info(i18n.__('The Mongo IP Port : %s', configService.get("datasource.mongoDB.port")));
  logger.info(i18n.__('The Blockchain IP Address : %s', configService.get("tendermintHost")));
  logger.info(i18n.__('The Blockchain Port : %s', configService.get("tendermintPort")));
  logger.info(i18n.__('The Logging IP Address : %s', configService.get("log4jsMongoHost")));
  logger.info(i18n.__('The Logging Port : %s', configService.get("log4jsMongoHost")));
  logger.info(i18n.__('The Monitoring IP Address : %s', configService.get("ngrtStatsdHost")));
  logger.info(i18n.__('The Monitoring Port : %s', configService.get("ngrtStatsdHost")));
  logger.info(i18n.__('The Smart Contract IP Address : %s', configService.get("smartContractsHost")));
  logger.info(i18n.__('The Smart Contract Port : %s', configService.get("smartContractsHost")));
  logger.info(i18n.__('The Docker Console Admin Port : %s', configService.get("dockerAdminPort")));
  logger.info(i18n.__('The AWS ID : %s', configService.get("aws:id")));
  logger.info(i18n.__('The AWS key : %s', configService.get("aws:key")));
  logger.info(i18n.__('The AWS region : %s', configService.get("aws:region")));
  logger.info(i18n.__('HTTPS protocol : %s', configService.get("https")));
}

module.exports = command;
