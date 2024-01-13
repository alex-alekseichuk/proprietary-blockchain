'use strict';

const result = {
  autoUpdate: {
    default: process.env.autoUpdate || "true",
    processEnv: process.env.autoUpdate
  },
  MongoDB_Port: {
    default: process.env.MongoDB_Port || 37017,
    processEnv: process.env.MongoDB_Port
  }
};

result.autoUpdate.default = (result.autoUpdate.default == "true");

const defaultConstants = {};
Object.keys(result).forEach(field => {
  defaultConstants[field] = result[field].default;
});

module.exports.defaultConstants = defaultConstants;
module.exports.constants = result;
