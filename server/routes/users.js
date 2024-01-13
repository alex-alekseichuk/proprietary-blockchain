'use strict';

/**
 * API/Route/users
 *
 * @module API/Route/users
 * @type {Object}
 */

module.exports = server => {
  const User = server.models.User;
  const Role = server.models.Role;
  const RoleMapping = server.models.RoleMapping;

  /**
   * Get a list of users with their roles
   *
   *  it : https://gitlab.project.com/qa/it/raw/dev/3.0/tests/integration/ng-rt-core/routes_users_test.js
   *
   * @name Get a list of users
   * @route {GET} /${namespace}/users
   * @bodyparam {String} user.id Id of the user
   * @authentication Requires valid session token via Role authentication
   * @returnparam {object} keys [status] 200 = OK  500 = Error
   */
  server.get("/users", server.ensureHasAccess('admin.users'), (req, res) => {
    Promise.all([
      User.find(),
      Role.find(),
      RoleMapping.find({where: {principalType: RoleMapping.USER}})
    ]).then(lists => {
      const users = JSON.parse(JSON.stringify(lists[0]));
      const roles = lists[1].reduce((roles, role) => {
        roles[role.id] = role;
        return roles;
      }, {});
      const usersRoles = lists[2].reduce((map, record) => {
        if (!map[record.principalId])
          map[record.principalId] = [];
        map[record.principalId].push(record.roleId);
        return map;
      }, {});
      users.forEach(user => {
        if (usersRoles[user.id])
          user.roles = usersRoles[user.id].map(roleId => roles[roleId]);
      });
      res.status(200).json(users);
    }).catch(err => {
      res.status(500).json(err);
    });
  });

  /**
   * Get a list of roles
   *
   *  it : https://gitlab.project.com/qa/it/raw/dev/3.0/tests/integration/ng-rt-core/routes_users_test.js
   *
   * @name Get a list of roles
   * @route {GET} /${namespace}/roles
   * @bodyparam {String} user.id Id of the user
   * @authentication Requires valid session token
   * @returnparam {object} keys [status] 200 = OK  500 = Error
   */
  server.get("/roles", server.ensureLoggedIn(), (req, res) => {
    Role.find({}).then(roles => {
      res.status(200).json(roles);
    }).catch(err => {
      res.status(500).json(err);
    })
      .then(() => {
        res.end();
      });
  });

  /**
   * Get a list of roles assigned for a user
   *
   *  it : https://gitlab.project.com/qa/it/raw/dev/3.0/tests/integration/ng-rt-core/routes_users_test.js
   *
   * @name Get a list of roles assigned for a user
   * @route {GET} /${namespace}/userRoles
   * @queryparam {String} userid Id of the user
   * @authentication Requires valid session token via Role authentication
   * @returnparam {object} keys [status] 200 = OK  500 = Error
   */
  server.get("/userRoles", server.ensureLoggedIn(), (req, res) => {
    User.getRoles(req.query.userId, (err, roles) => {
      if (err) res.status(500).json(err);
      else res.status(200).json(roles);
      res.end();
    });
  });

  /**
   * Add a role to a user
   *
   * @name Add a role to a user
   * @route {POST} /${namespace}/addRoleToUser
   * @bodyparam {String} userid Id of the user
   * @bodyparam {String} roleId Id of the role
   * @authentication Requires valid session token via Role authentication
   * @returnparam {object} keys [status] 200 = OK  500 = Error
   */
  server.post('/addRoleToUser', server.ensureHasAccess('admin.users'), (req, res) => {
    User.addRole(req.body.userId, req.body.roleId)
      .then(() => {
        res.status(200);
        res.end();
      })
      .catch(err => {
        res.status(500).json(err);
        res.end();
      });
  });

  /**
   * Remove a role to a user
   *
   *  it : https://gitlab.project.com/qa/it/raw/dev/3.0/tests/integration/ng-rt-core/routes_users_test.js
   *
   * @name Remove a role to a user
   * @route {POST} /${namespace}/addRoleToUser
   * @bodyparam {String} userid Id of the user
   * @bodyparam {String} roleId Id of the role
   * @authentication Requires valid session token via Role authentication
   * @returnparam {object} keys [status] 200 = OK  500 = Error
   */
  server.post('/removeRoleFromUser', server.ensureHasAccess('admin.users'), (req, res) => {
    User.removeRole(req.body.userId, req.body.roleId, err => {
      if (err) res.status(500).json(err);
      else res.status(200);
      res.end();
    });
  });
};
