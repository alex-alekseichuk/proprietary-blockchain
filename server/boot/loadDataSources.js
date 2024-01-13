'use strict';

const logger = require('log4js').getLogger('boot.loadDataSources');
const configService = require('../backend/configService');
const dataRoutingService = require('../services/dataRoutingService')(configService);
module.exports = function(app, cb) {
  if (app.serviceMode)
    return cb();
  logger.debug('Loading datasource records');
  app.models.dataSource.find({})
    .then(items => items.reduce(
      async (p, item) => p.then(() => dataRoutingService.getOrCreateDataSourceRecord(item, app)),
      Promise.resolve()))
    .then(() => cb(null))
    .catch(err => {
      logger.error(err);
      cb(err);
    });
  // cb(null)
};
