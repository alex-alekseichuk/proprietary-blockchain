"use strict";

const getConfigValue = (conf, propertyName) => {
  if (propertyName.indexOf('.') > -1 && conf[propertyName.split('.')[0]]) {
    return getConfigValue(conf[propertyName.split('.')[0]], propertyName.slice(propertyName.indexOf('.') + 1));
  }
  return conf[propertyName];
};

module.exports = config => {
  return {
    get: name => {
      return getConfigValue(config, name);
    }
  };
};
