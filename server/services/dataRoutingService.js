/**
 * @module API/Service/dataRoutingService
 * @type {object}
 */
'use strict';

const logger = require('log4js').getLogger('services.dataRoutingService');
let configService;

/**
 * Get reference to datasource by its record in db.
 * Create it if it's absent.
 * @param {string} dsRecord datasource record
 * @param {object} app loopback application
 * @return {Promise} datasource
 */
async function getOrCreateDataSourceRecord(dsRecord, app) {
  if (!dsRecord && !dsRecord.name)
    throw Error(`Can't find data source record ${dsRecord.name}`);

  const datasourceName = dsRecord.name;

  if (app.dataSources[datasourceName])
    return app.dataSources[datasourceName];

  logger.trace('Datasource : %s - useDefaultConnection : %s ', dsRecord.name, dsRecord.useDefaultConnection);
  let dsConfig = dsRecord;
  if (dsRecord.useDefaultConnection) {
    dsConfig = configService.get('datasources.default', dsRecord);

    logger.trace('UseDefaultConnection');

    let prefix = '';
    if (dsRecord.databasePrefix) {
      if (dsRecord.databasePrefix === 'default') {
        prefix = configService.get('serverEnvironment') + '_' +
          configService.get('blockchainClusterId') + '_' +
          configService.get('clusterId') + '_' +
          configService.get('instanceId') + '_' +
          configService.get('tenantId') + '_';
      } else {
        prefix = dsRecord.databasePrefix;
      }
    }

    dsConfig.database = prefix + dsRecord.database;
  } else if (dsRecord.useConnectorConnection && dsRecord.connector) {
    dsConfig = configService.get('datasources.' + dsRecord.connector, dsRecord);
  }

  logger.trace('Create datasource %s :', dsRecord.name);
  logger.trace(dsConfig);
  return app.dataSource(datasourceName, dsConfig);
}

/**
 * Get reference to datasource by its name.
 * Create it if it's absent.
 * @param {string} datasourceName name of datasource
 * @param {object} app loopback application
 * @return {Promise} datasource
 */
async function getOrCreateDataSource(datasourceName, app) {
  if (app.dataSources[datasourceName])
    return app.dataSources[datasourceName];
  return app.models.dataSource.findOne({where: {name: datasourceName}}).then(dsRecord => {
    if (!dsRecord)
      throw Error(`Can't find data source record ${datasourceName}`);
    return getOrCreateDataSourceRecord(dsRecord, app);
  });
}

/**
 * Get reference to data dictionary. Create it if it's absent.
 * @param {string} dataModelName name of data model
 * @param {object} app loopback application
 * @return {Promise} data dictionary
 */
async function getOrCreateDataDictionary(dataModelName, app) {
  return app.models.dataDictionary.findOne({where: {name: dataModelName}}).then(item => {
    if (!item)
      return null;
    return app.loopback.createModel(JSON.parse(JSON.stringify(item)));
  });
}

/**
 * Create data routing for specified datasource and data dictionary.
 * @param {object} data it has datasourcename and datadictname properties.
 * @param {object} app loopback application
 */
async function createDataRouting(data, app) {
  if (!data)
    return;
  try {
    logger.trace('datasourcename %s', data.datasourcename);
    const ds = await getOrCreateDataSource(data.datasourcename, app);
    logger.trace('datadictname %s', data.datadictname);
    const model = await getOrCreateDataDictionary(data.datadictname, app);
    logger.trace('Attach new Model %s to Datasource: %s', data.datadictname, data.datasourcename);
    ds.attach(model);
    app.model(model);
    const isActual = await ds.isActual(model.name);
    if (!isActual) {
      logger.trace('Starting autoupdate for %s ', model.name);
      await ds.autoupdate(model.name);
    }
  } catch (e) {
    logger.error(e);
  }
}

/**
 * Create data routing for specified datasource and data dictionary.
 * @param {object} data it has datadictname property.
 * @param {object} app loopback application
 */
function deleteDataRouting(data, app) {
  app.models[data.instance.datadictname] = null;
}

module.exports = _configService => {
  configService = _configService;
  return {
    getOrCreateDataSource: getOrCreateDataSource,
    getOrCreateDataSourceRecord: getOrCreateDataSourceRecord,
    getOrCreateDataDictionary: getOrCreateDataDictionary,
    createDataRouting: createDataRouting,
    deleteDataRouting: deleteDataRouting
  };
};
