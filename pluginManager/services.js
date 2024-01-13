/**
 * it provides access to backend modules (blockchain  etc) and core services for installed applications
 * applications can also add their own shared services here
 */
'use strict';

const services = require('../server/services');

module.exports = () => {
  return services;
};
