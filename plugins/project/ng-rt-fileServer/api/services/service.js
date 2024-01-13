'use strict';

module.exports = {
  activate: services => {
    services.add('fileServer', require('./services/fileServer')(services));
  },

  deactivate: services => {
    services.remove('fileServer');
  }
};
