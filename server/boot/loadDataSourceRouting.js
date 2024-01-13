'use strict';

const logger = require('log4js').getLogger('boot.loadDataSourceRouting');
const configService = require('../backend/configService');
const dataRoutingService = require('../services/dataRoutingService')(configService);
module.exports = async function(app, cb) {
  if (app.serviceMode)
    return cb();
  logger.debug('Loading datasourceRouting objects');
  try {
    let items = await app.models.dataSourceRouting.find({});
    await items.reduce(
      async (p, item) => p.then(() => dataRoutingService.createDataRouting(item, app)),
      Promise.resolve());
    logger.debug('Done');
    cb();
  } catch (err) {
    logger.error(err);
    cb(err);
  }
  // cb(null);
};
