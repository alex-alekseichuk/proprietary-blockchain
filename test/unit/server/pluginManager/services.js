'use strict';
const configService = require('./configService');

module.exports = params => {
  let services = {
    configService: configService(params.config),
    initialConfigService: configService(params.config),
    i18n: {
      __: val => {
        return val;
      }
    }
  };
  return {
    get: name => {
      return services[name];
    }
  };
};
