'use strict';

const deleteConfigFile = require('./services/deleteConfigFile');
const deleteConfigDb = require('./services/deleteConfigDb');
const deleteConfirmDialog = require('./services/deleteConfirmDialog');
const deleteCustomPlugins = require('./services/deleteCustomPlugin');
const deleteLogs = require('./services/deleteLogs');
const deleteNodeModules = require('./services/deleteNodeModules');
const deleteNodeRedFlows = require('./services/deleteNodeRedFlows');
const deletePlugins = require('./services/deletePlugins');
const deleteDataSource = require('./services/deleteDataSource');

module.exports = {
  configFile: {
    delete: deleteConfigFile
  },
  configDb: {
    delete: deleteConfigDb
  },
  confirmDialog: {
    delete: deleteConfirmDialog
  },
  customPlugins: {
    delete: deleteCustomPlugins
  },
  log: {
    delete: deleteLogs
  },
  nodeModules: {
    delete: deleteNodeModules
  },
  nodeRedFlows: {
    delete: deleteNodeRedFlows
  },
  plugins: {
    delete: deletePlugins
  },
  dataSource: {
    drop: deleteDataSource
  }
};
