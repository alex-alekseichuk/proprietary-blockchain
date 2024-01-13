'use strict';
const _ = require('lodash');
const {promisify} = require('util');
const {common} = require('ng-common');
const util = common.util;
/**
 * API/Service/authorization
 *
 * @module API/Service/authorization
 * @type {object}
 */

/**
 * Authorization API
 * @param {Object} app - application instance
 * @return {Object} {{getUserDomains: (function(Object))}}
 */
const authorization = app => {
  return {
    /**
     * Get domains by user instance
     * @param {Object} user - instance of user, which domains must be founded
     * @return {Promise} Promise, which return records with domain id
     */
    getUserDomains: user => {
      const Authorisation = app.models.authorisation;
      const Domain = app.models.domain;
      const User = app.models.user;
      const getRoleNames = promisify(User.getRoleNames);

      return util.promiseProps({
        byUser: Authorisation.find({
          where: {
            scope: 'user',
            toId: user.username,
            objType: 'domain'
          }
        }),
        byRoles: getRoleNames(user.id).then(userRoles => Authorisation.find({
          where: {
            scope: 'role',
            toId: {inq: userRoles},
            objType: 'domain'
          }
        })),
        forAll: Authorisation.find({
          where: {
            scope: 'all',
            objType: 'domain',
            allow: true
          }
        })
      }).then(auths => {
        const userDomainAuths = _.uniqBy(_.unionBy(
          _.filter(auths.byUser, auth => auth.allow),
          _.differenceBy(
            _.unionBy(
              _.filter(auths.byRoles, auth => auth.allow),
              _.differenceBy(auths.forAll, _.filter(auths.byRoles, auth => !auth.allow), 'objId'),
              'objId'),
            _.filter(auths.byUser, auth => !auth.allow), 'objId'),
          'objId'), 'objId');
        return Domain.find({where: {domainId: {inq: _.map(userDomainAuths, auth => auth.objId)}}});
      }).then(records => _.uniqBy(records, 'domainId'));
    }
  };
};

module.exports = authorization;
