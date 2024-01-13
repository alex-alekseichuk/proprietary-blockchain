'use strict';

const commands = require('./commands/initialize');
const configService = require('ng-configService');
const logger = require('log4js').getLogger('test_commands_init');
configService.read('config/server/config.json');
/*
commands.configFile.delete(configService);
commands.confirmDialog.delete(configService);
commands.customPlugin.delete(configService);
commands.log.delete(configService);
commands.nodeModules.delete(configService);
commands.nodeRedFlows.delete(configService);
commands.plugins.delete(configService);
commands.mongoDatabase.drop(configService);
commands.datasources.delete(configService);
*/

return new Promise(function(resolve, reject) {
  commands.confirmDialog.delete(configService)
    .then(result => {
      logger.info('confirmDialog :', result);
      return commands.customPlugin.delete(configService, result);
    }).then(result => {
      logger.info('customPlugin :', result);
      return commands.log.delete(configService);
    }).then(result => {
      logger.info('log :', result);
      return commands.nodeModules.delete(configService);
    }).then(result => {
      logger.info('nodeModules :', result);
      return commands.nodeRedFlows.delete(configService);
    }).then(result => {
      logger.info('nodeRedFlows :', result);
      return commands.plugins.delete(configService);
    }).then(result => {
      logger.info('plugins :', result);
      return commands.mongoDatabase.drop(configService);
    }).then(result => {
      logger.info('mongoDatabase :', result);
      return commands.datasources.delete(configService);
    }).then(result => {
      logger.info('datasources :', result);
      return commands.configFile.delete(configService);
    }).then(result => {
      logger.info('configFile :', result);
      logger.info('DONE');
      return resolve(null);
    })
    .catch(err => {
      logger.error('Error :', err);
      return reject(err);
    });
});
