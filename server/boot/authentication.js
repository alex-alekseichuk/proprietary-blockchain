'use strict';

const logger = require('log4js').getLogger('authentication');
const {createDefaultUsers} = require('./helper_functions/createDefaultUsers');
const {createDefaultAccessList} = require('./helper_functions/createDefaultAccessList');
const i18n = require('i18n');

/**
 *
 * @param {*} server Server instance
 * @param {function} cb finish callback
 * @return {undefined}
 */
async function enableAuthentication(server, cb) {
  if (server.serviceMode)
    return cb();

  const {User, Role, RoleMapping, Access} = server.models;
  let testUsers = [{
    roleName: 'admin',
    userName: 'admin'
  }, {
    roleName: 'appadmin',
    userName: 'appadmin'
  }, {
    roleName: 'sysadmin',
    userName: 'sysadmin'
  }, {
    roleName: 'licadmin',
    userName: 'licadmin'
  }, {
    roleName: 'user',
    userName: 'user1'
  }, {
    roleName: 'user',
    userName: 'user2'
  }, {
    roleName: 'developer',
    userName: 'developer1'
  }];
  /*
  Principal	An entity that can be identified or authenticated.
  Represents identities of a request to protected resources.
  A user
  An application
  A role (please note a role is also a principal)
  */

  server.enableAuth();

  RoleMapping.belongsTo(User, {foreignKey: 'principalId'});
  RoleMapping.belongsTo(Role, {foreignKey: 'roleId'});
  RoleMapping.belongsTo(Access, {as: 'principal', foreignKey: 'principalId'});
  User.hasMany(Role, {through: RoleMapping, foreignKey: 'principalId'});
  User.hasMany(RoleMapping, {foreignKey: 'principalId'});
  Access.hasMany(Role, {through: RoleMapping, foreignKey: 'principalId'});
  Access.hasMany(RoleMapping, {foreignKey: 'principalId', as: 'principals'});
  Role.hasMany(Access, {through: RoleMapping, foreignKey: 'roleId'});
  Role.hasMany(User, {through: RoleMapping, foreignKey: 'roleId'});

  User.getRoles = function(userId, callback) {
    User.findOne({where: {id: userId}}, (err, user) => {
      if (err) return callback(err);
      if (user) {
        RoleMapping.find({where: {principalId: userId, principalType: RoleMapping.USER}}, (err, mappings) => {
          if (err) return callback(err);
          var roles = mappings.map(function(pr) {
            return pr.roleId;
          });
          callback(null, roles);
        });
      } else {
        var error = new Error("User with id:" + userId + " don't found");
        callback(error);
      }
    });
  };

  User.getRoleNames = function(userId, callback) {
    logger.trace('User.getRoleNames:', userId);

    User.findOne({where: {id: userId}}, (err, user) => {
      if (err) return callback(err);
      if (user) {
        logger.trace('User', user);
        RoleMapping.find({where: {principalId: userId, principalType: RoleMapping.USER}}, (err, mappings) => {
          if (err) return callback(err);
          logger.trace('mappings', mappings);
          var roles = mappings.map(function(pr) {
            return pr.roleId;
          });
          Role.find({where: {id: {inq: roles}}}, function(err, roles) {
            if (err) return callback(err);
            logger.trace('roles', roles);

            var names = roles.map(function(r) {
              return r.name;
            });
            callback(null, names);
          });
        });
      } else {
        var error = new Error("User with id:" + userId + " notfound");
        callback(error);
      }
    });
  };

  User.addRole = function(userId, roleId) {
    return new Promise((resolve, reject) => {
      Role.findOne({where: {id: roleId}})
        .then(role => {
          if (role) {
            return role.principals.create({
              principalType: RoleMapping.USER,
              principalId: userId
            })
            .then(principal => {
              return resolve(principal);
            })
            .catch(err => reject(err));
          }
          reject(new Error("Role with id " + roleId + " not found."));
        })
        .catch(err => reject(err));
    });
  };

  User.removeRole = function(userId, roleId, callback) {
    RoleMapping.findOne({where: {principalType: RoleMapping.USER, principalId: userId, roleId: roleId}})
        .then(mapping => {
          if (mapping) {
            mapping.destroy(err => {
              if (err) return callback(err);
              callback(null);
            });
          } else {
            callback(new Error("No role " + roleId + "from user " + userId));
          }
        });
  };

  User.appendRoles = function(users) {
    return new Promise((resolve, reject) => {
      Role.find({}).then(roles => {
        var count = 0;
        users.forEach(user => {
          RoleMapping.find({
            where: {
              principalType: RoleMapping.USER,
              principalId: user.id
            }
          }).then(mappings => {
            user.roles = [];
            logger.trace(i18n.__(user));
            mappings.forEach(mapping => {
              roles.forEach(role => {
                if (role.id == mapping.roleId) {
                  user.roles.push(role);
                }
              });
            });
            count++;
            if (count >= users.length) {
              logger.trace(i18n.__('roles appended: ', typeof (user), user, users));
              resolve(users);
            }
          }).catch(err => {
            reject(err);
          });
        });
      }
      );
    });
  };

  await createDefaultUsers(server, testUsers);
  await createDefaultAccessList(server);
  cb();
}

module.exports = enableAuthentication;

