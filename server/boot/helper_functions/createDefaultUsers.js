'use strict';

const logger = require('log4js').getLogger('boot/helper_functions/authentication');
const configService = require('../../backend/configService');
// const configService = require('ng-configservice');
// configService.read('config/server/config.json');

const i18n = require('i18n');

let roleUtils;
let User;
let Role;

/**
 *
 * @param {*} server calls server
 * @param {*} defaultUsers default users array being passed
 * @param {*} findOrCreateRoles roles are assigned to the users
 * @param {*} findOrCreateUsers users created
 * @return {*} finds or creates users and assigns roles to them
 */
function createDefaultUsers(server, defaultUsers, findOrCreateRoles = _findOrCreateRoles,
  findOrCreateUsers = _findOrCreateUsers) {
  User = server.models.User;
  Role = server.models.Role;
  roleUtils = require('../../../common/utils/roles')(Role);

  return findOrCreateRoles(distinctRoles(defaultUsers.map(user => user.roleName)))
    .then(roles => {
      defaultUsers.forEach(defaultUser => {
        defaultUser.role = roles.find(role => role.name === defaultUser.roleName);
      });
      return findOrCreateUsers(defaultUsers);
    })
    .catch(err => logger.error(err));
}
/**
 *
 * @param {*} arr get distinct roles from the array of users being passed
 * @return {*} return distinct roles
 */
function distinctRoles(arr) {
  return arr.filter((v, i, a) => a.indexOf(v) === i);
}
/**
 *
 * @param {*} roles checking existing roles or creating new roles
 * @return {*} return roles
 */
function _findOrCreateRoles(roles) {
  return Promise.all(roles.map(roleName => findOrCreateRole(roleName)));
}
/**
 *
 * @param {*} roleName checking existing roles or creating new roles
 * @return {*} return roles
 */
function findOrCreateRole(roleName) {
  return new Promise((resolve, reject) => {
    roleUtils.getRoleByName(roleName)
      .then(role => {
        if (role) {
          logger.trace(i18n.__('findOrCreateRole: Role "%s" already exists', role.name));
          return resolve(role);
        }
        let newRole = {
          name: roleName
        };
        Role.create(newRole)
          .then(role => {
            if ((role) && (!role.id)) {
              Role.findOne({where: {name: roleName}})
                .then(role => {
                  logger.trace(i18n.__('findOrCreateRole: New role "%s" created successfully', role.name));
                  resolve(role);
                });
            } else {
              logger.trace(i18n.__('findOrCreateRole: New role "%s" created successfully', role.name));
              resolve(role);
            }
          })
          .catch(err => {
            logger.error("rejecting Role.create with err, ", err);
            reject(err);
          });
      }).catch(err => {
        logger.error("rejecting getRoleByName error, ", err);
        reject(err);
      });
  });
}
/**
 *
 * @param {*} users checking existing users or creating new users
 * @return {*} return users
 */
function _findOrCreateUsers(users) {
  return Promise.all(users.map(user => findOrCreateUser(user.userName, user.role)));
}
/**
 *
 * @param {*} userName gets user name as the argument
 * @param {*} role gets roles as the argument
 * @return {*} return existing or new users
 */
function findOrCreateUser(userName, role) {
  return new Promise((resolve, reject) => {
    User.findOne({where: {username: userName}})
      .then(user => {
        if (user) {
          logger.trace(i18n.__('findOrCreateUser: User "%s" already exists', user.username));
          return resolve(user);
        }
        let newUser = {
          username: userName,
          password: _getDefaultUserPassword(userName),
          email: `${userName}@example.com`,
          emailVerified: true,
          system: true
        };
        User.create(newUser)
          .then(user => {
            logger.trace(i18n.__('findOrCreateUser: New user "%s" created successfully', user.username));
            logger.trace(user);
            if ((user) && (!user.id)) {
              User.findOne({where: {username: userName}})
                .then(user => {
                  User.addRole(user.id, role.id)
                    .then(() => {
                      logger.debug(i18n.__('Added role "%s" to user "%s"', role.name, user.username));
                      resolve(user);
                    });
                });
            } else {
              User.addRole(user.id, role.id)
              .then(() => {
                logger.debug(i18n.__('Added role "%s" to user "%s"', role.name, user.username));
                resolve(user);
              })
              .catch(err => reject(err));
            }
          })
          .catch(err => reject(err));
      })
      .catch(err => reject(err));
  });
}
/**
 *
 * @param {*} userName gets username as the env variable argument for which the password has to be generated
 * @return {*} return passwords
 */
function _getDefaultUserPassword(userName) {
  const defaultPassword = 'project@2020';
  // getting value from environment variable
  const encodedPassword = configService.get(`pwd_${userName}`);
  if (!encodedPassword) return defaultPassword;
  const buff = new Buffer(encodedPassword, 'base64');
  const password = buff.toString('utf8');
  return password;
}

module.exports = {
  createDefaultUsers,
  distinctRoles,
  _getDefaultUserPassword
};
