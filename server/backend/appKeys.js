"use strict";
var logger = require('log4js').getLogger('service.app-keys');

module.exports = server => {
  return {
    get: userId => {
      return new Promise((resolve, reject) => {
        server.models.appKey.find({where: {userId}}).then(resolve).catch(err => {
          logger.error(err);
        });
      });
    },
    create: (application, userId, domainID) => {
      return new Promise((resolve, reject) => {
        require('crypto').randomBytes(25, function(err, buffer) {
          var key = buffer.toString('hex');
          logger.trace("Create app key", key);
          server.models.appKey.create({
            appID: application,
            appKey: key,
            userId,
            domainID: domainID
          }).then(resolve).catch(err => {
            logger.error(err);
            reject(err);
          });
        });
      });
    },
    delete: id => {
      return new Promise((resolve, reject) => {
        server.models.appKey.destroyById(id).then(resolve).catch(err => {
          logger.error(err);
        });
      });
    }
  };
};
