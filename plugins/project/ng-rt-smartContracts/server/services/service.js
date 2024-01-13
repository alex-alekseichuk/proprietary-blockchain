'use strict';

module.exports = {
  activate: services => {
    services.add('smartContracts.service', require('./services/smartContract'));
  },

  deactivate: services => {
    services.remove('smartContracts.service');
  }
};
