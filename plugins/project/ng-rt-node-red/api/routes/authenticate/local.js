'use strict';
const logger = require('log4js').getLogger('ng-rt-node-red.authenticate.local');

module.exports = (User, roles) => {
  return {
    authenticate: (username, password) => {
      return new Promise((resolve, reject) => {
        User.findOne({
          where: {
            username: username
          }
        })
          .then(user => {
            if (user) {
              return user.hasPassword(password).then(isMatch => {
                if (!isMatch)
                  return resolve(null);
                if (roles) {
                  return User.getRoleNames(user.id.toString(), (err, userRoles) => {
                    if (err) {
                      logger.debug(err);
                    }
                    if (roles.some(r => userRoles.indexOf(r) > -1))
                      return resolve({username: user.username, permissions: "*"});
                    resolve(null);
                  });
                }
                return resolve({username: user.username, permissions: "*"});
              });
            }
            resolve(null);
          }).catch(err => {
            logger.error(err);
            resolve(null);
          });
      });
    },
    users: username => {
      return new Promise((resolve, reject) => {
        User.findOne({
          where: {
            username: username
          }
        })
          .then(user => {
            if (user)
              return resolve({username: user.username, permissions: "*"});
            resolve(null);
          }).catch(err => {
            logger.error(err);
            resolve(null);
          });
      });
    }
  };
};
