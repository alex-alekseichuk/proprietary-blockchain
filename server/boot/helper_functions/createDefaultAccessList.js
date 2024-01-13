'use strict';

const logger = require('log4js').getLogger('authentication');
/**
 *
 * @param {*} server calls server
* @return {Promise} result
 */
function createDefaultAccessList(server) {
  const {Access, Role, RoleMapping} = server.models;

  const defaultAccessList = [{
    name: 'admin.users',
    roles: ['admin']
  }];

  return Promise.all(defaultAccessList.map(_createDefaultAccess(Access, Role, RoleMapping)));
}
/**
 *
 * @param {*} Access gets access name parameter
 * @param {*} Role model
 * @param {*} RoleMapping model
 * @return {*} return access details with user and role
 */
function _createDefaultAccess(Access, Role, RoleMapping) {
  return ({name, roles}) => {
    return Access.findOne({where: {name}})
      .then(access => {
        if (access) {
          logger.trace(`Access '${name}' already created`);
          addAccessToRoles(access, roles, Role, RoleMapping);
        } else {
          Access.create({name})
            .then(access => {
              addAccessToRoles(access, roles, Role, RoleMapping);
            })
            .catch(logger.error);
        }
      })
      .catch(logger.error);
  };
}
/**
 *
 * @param {*} access gets access info
 * @param {*} roles gets roles list
 * @param {*} Role model
 * @param {*} RoleMapping model
 */
function addAccessToRoles(access, roles, Role, RoleMapping) {
  roles.forEach(roleName => {
    Role.findOne({where: {name: roleName}})
      .then(role => {
        if (role)
          return RoleMapping.findOrCreate({
            principalType: 'ACCESS',
            principalId: access.id,
            roleId: role.id
          });
        return Promise.reject(`Role ${roleName} not found`);
      })
      .then(() => {
        logger.trace(`Access '${access.name}' added to role '${roleName}'`);
      })
      .catch(logger.error);
  });
}

module.exports = {
  createDefaultAccessList
};
