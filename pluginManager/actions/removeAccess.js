'use strict';
const actionName = "REMOVE_ACCESS";
const logger = require('log4js').getLogger('action.remove_access');

module.exports = (actions, configService) => {
  actions[actionName] = (pluginInstance, parameters, server) => {
    const {Role, Access} = server.models;
    return new Promise((resolve, reject) => {
      const {accessList} = parameters;
      const accessPromises = accessList.map(({access: accessName, roles}) => {
        const rolesPromises = roles.map(roleName => {
          let roleToRemove;
          let accessToRemove;
          return Role.findOne({where: {name: roleName}})
            .then(role => {
              roleToRemove = role;
              return Access.findOne({where: {name: accessName}});
            })
            .then(access => {
              accessToRemove = access;
              return accessToRemove.roles({where: {name: roleName}});
            })
            .then(roles => {
              const role = roles[0];
              if (!role) {
                logger.debug(`Role '${roleName}' hasn't access '${accessName}' already`);
                return Promise.resolve();
              }
              return accessToRemove.roles.remove(roleToRemove)
                .then(() => {
                  logger.debug(`Removed access '${accessName}' from role '${roleName}'`);
                })
                .then(() => {
                  return accessToRemove.roles({})
                    .then(roles => {
                      logger.debug(`Now '${accessName}' access has the following roles:`, roles.map(role => role.name));
                    });
                });
            });
        });
        return Promise.all(rolesPromises);
      });
      Promise.all(accessPromises)
        .then(resolve)
        .catch(err => {
          logger.error(err);
          reject(err);
        });
    });
  };
};
