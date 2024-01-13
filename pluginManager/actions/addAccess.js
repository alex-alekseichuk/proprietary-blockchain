'use strict';
const actionName = "ADD_ACCESS";
const logger = require('log4js').getLogger('action.add_access');

module.exports = (actions, configService) => {
  actions[actionName] = (pluginInstance, parameters, server) => {
    const {Role, Access} = server.models;
    return new Promise((resolve, reject) => {
      const {accessList} = parameters;
      const accessPromises = accessList.map(({access: accessName, roles}) => {
        const rolesPromises = roles.map(roleName => {
          let roleToAdd;
          let accessToAdd;
          return Role.findOne({where: {name: roleName}})
            .then(role => {
              roleToAdd = role;
              return Access.findOne({where: {name: accessName}});
            })
            .then(access => {
              accessToAdd = access;
              return access.roles({where: {name: roleName}});
            })
            .then(roles => {
              const role = roles[0];
              if (role) {
                logger.debug(`Role '${roleName}' already has access '${accessName}'`);
                return Promise.resolve();
              }
              return accessToAdd.principals.create({roleId: roleToAdd.id, principalType: 'ACCESS'})
                .then(() => {
                  logger.debug(`Added access '${accessName}' to role '${roleName}'`);
                })
                .then(() => {
                  return accessToAdd.roles({})
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
