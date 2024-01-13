'use strict';
const DATABASE_TYPE_PROPERTY_NAME = "databaseType";

module.exports = (configService, i18n) => {
  let errorsFactory = require('./errors')(i18n);
  const errors = errorsFactory.errors;
  const getError = errorsFactory.error;

  /**
   * check plugin for all dependencies
   * @param {object} dependencies plugin dependencies for check
   * @param {Array.<object>} plugins array of installed plugins
   * @return {Promise.<Array>} array with result of check
   */
  function checkAll(dependencies, plugins) {
    return new Promise((resolve, reject) => {
      let result = [];
      if (!dependencies)
        return resolve(dependencies);
      checkPluginsDependencies(dependencies.plugins, plugins).then(pluginsResult => {
        result = result.concat(pluginsResult);
        return checkDatabaseDependencies(dependencies.database);
      }).then(databaseResult => {
        result = result.concat(databaseResult);
        resolve(result);
      });
    });
  }

  /**
   * check plugin for plugins dependency
   * @param {object} dependencies plugin dependencies for check
   * @param {Array.<object>} plugins array of installed plugins
   * @return {Promise.<object>} array of errors-result of checks, empty if check is ok
  */
  function checkPluginsDependencies(dependencies, plugins) {
    return new Promise((resolve, reject) => {
      let result = [];
      if (!dependencies || dependencies.length === 0)
        return resolve(result);
      dependencies.forEach(dep => {
        let check = plugins.find(p => p.name === dep.name && p.activated);
        if (!check) {
          result.push(getError(errors.pluginNotExist, dep.name));
          return resolve(result);
        }
        if (!check.installed)
          result.push(getError(errors.pluginNotInstalled, dep.name));
        if (!check.activated)
          result.push(getError(errors.pluginNotAcitavated, dep.name));
      });
      resolve(result);
    });
  }

  /**
   * check plugin for database dependecies
   * @param {object} dependencies plugin dependencies for check
   * @return {Promise.<Array>} array of errors-result of checks, empty if check is ok
   */
  function checkDatabaseDependencies(dependencies) {
    return new Promise((resolve, reject) => {
      let result = [];
      let databases = Object.keys(dependencies);
      if (databases.length != 1)
        return resolve(result);
      if (databases[0] != configService.get(DATABASE_TYPE_PROPERTY_NAME))
        result.push(getError(errors.wrongDatabase, databases[0]));
      resolve(result);
    });
  }

  return {
    check: checkAll,
    checkPlugins: checkPluginsDependencies,
    checkDatabase: checkDatabaseDependencies,
    errors: errors
  };
};
