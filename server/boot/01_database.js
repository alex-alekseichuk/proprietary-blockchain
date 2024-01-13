'use strict';

const logger = require('log4js').getLogger('01_database.js');
const configService = require('../backend/configService');

module.exports = async function(app, cb) {
  if (app.serviceMode)
    return cb();
  // we need to define logic for decision
  logger.debug('01_database', app.serviceMode);

  await autoupdate(app);
  cb();

  /**
   * Automatically alter the table schemas based on the model definitions.
   * Autoupdate() calculates the difference between the LoopBack model
   * and the database table definition and alters the table accordingly. This way,
   * the column data will be kept as long as the property is not deleted from the model.
   *
   * @param {*} app loopback application
   */
  async function autoupdate(app) {
    logger.debug('loopback-boot routine model.autoupdate gets executed');

    if (configService.get('datasources.default.connector') == 'mongodb')
      return;
    var models = ['AccessToken', 'ACL', 'RoleMapping', 'Role', 'user', 'userSSH', 'plugin',
      'dataSource', 'dataDictionary',
      'dataSourceRouting', 'route', 'keypair', 'emailSend', 'emailTemplate', 'Access', 'config'];

    var ds = app.datasources.ng_rt;

    logger.debug('Auto update for PROJECT models : [' + models + ']');

    try {
      await ds.autoupdate(models);
    } catch (err) {
      logger.error(err.message);
      // throw Error(`Can't autoupdate models ${models}`);
    }

    logger.debug('PROJECT ng_rt models [' + models + '] updated in', ds.adapter.name);
    return;
  }

  /**
   * Automatically create or re-create the table schemas based on the model definitions.
   * In relational databases, auto-migration creates a table for each model, and a column in the table
   * for each property in the model. Auto-migration creates tables for all models attached to a data source,
   * including  built-in models
   *
   * If there are existing tables in a database, running automigrate()
   * will drop and re-create the tables: Therefore, data will be lost !
   *
   * @param {*} app loopback application
   */

  /* eslint-disable */
  async function automigrate(app) {
    logger.debug('loopback-boot routine model.automigrate gets executed');

    if (configService.get('datasources.default.connector') == 'mongodb')
      return;

    // first autoupdate the `Author` model to avoid foreign key constraint failure
    var models = ['AccessToken', 'ACL', 'RoleMapping', 'Role', 'user', 'plugin', 'dataSource', 'dataDictionary',
      'dataSourceRouting', 'route', 'keypair', 'emailSend', 'emailTemplate', 'Access'];
    var ds = app.datasources.ng_rt;
    logger.info('Auto migrate for PROJECT models :[' + models + ']');

    const isActual = await ds.isActual(models);
    if (!isActual) {
      await ds.automigrate(models);
    }
    logger.info('PROJECT models [' + models + '] migrated in %s', ds.adapter.name);
  }
};
