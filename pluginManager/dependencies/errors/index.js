'use strict';

const DependenciesCheckError = require('./error');

module.exports = i18n => {
  let errors = {
    wrongDatabase: {code: 0, message: i18n.__("wrong database type")},
    pluginNotExist: {code: 1, message: i18n.__("Plugin from dependecies not exist")},
    pluginNotInstalled: {code: 2, message: i18n.__("Plugin from dependencies not installed")},
    pluginNotAcitavated: {code: 3, message: i18n.__("Plugin from dependencies not activated")}
  };

  return {
    error: (error, additionalMessage) => {
      let err = new DependenciesCheckError(error.code, error.message);
      if (additionalMessage)
        err.addMessage(additionalMessage);
      return err;
    },
    errors: errors
  };
};
