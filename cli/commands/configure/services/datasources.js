'use strict';
const logger = require('log4js').getLogger('commands.services.datasources');
const ds = require('./ds');

module.exports = configService => {
  logger.debug('executing datasources');

  var connector = configService.get('datasources.default.connector');

  switch (connector) {
    case ('mongodb'):
      return new Promise((resolve, reject) => {
        ds.mongoDB.create(configService);
        return resolve(true);
      });
    case ('postgresql'):
      return new Promise((resolve, reject) => {
        ds.postgreSQL.create(configService);
        return resolve(true);
      });
    case ('project-hana'):
      return new Promise((resolve, reject) => {
        ds.hana.create(configService);
        return resolve(true);
      });
    default:
      return new Promise((resolve, reject) => {
        ds.mongoDB.create(configService);
        return resolve(true);
      });
  }
};
