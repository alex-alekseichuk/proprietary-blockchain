"use strict";

const logger = require('log4js').getLogger('ng-app-documentsSharing/nsi/getAdminsOfOrgNSIService');
const _ = require('lodash');

/**
 * @type {service}
 * @param {Object} models - model's scope
 * @param {String} userId - current user's id
 * @return {Object} Promise
 */
module.exports = (models, userId) => {
  const OrganizationDomain = models.organizationDomain;
  const Organization = models.organization;
  const User = models.user;
  const publicKey = models.publicKey;

  logger.debug('_addAdminsOfOrg for userId:', userId);

  return User.findById(userId)
    .then(user => {
      logger.debug('found user email:', user.email);
      if (!user.email || user.email.indexOf('@') === -1)
        return;
      const domain = user.email.substr(user.email.indexOf('@') + 1);
      logger.debug('domain:', domain);
      return domain;
    })
    .then(domain =>
      OrganizationDomain.findOne({
        where: {
          domain: domain
        }
      })
    )
    .then(organizationDomain => {
      if (!organizationDomain) {
        logger.debug('No organization for this domain');
        return Promise.reject(null);
      }
      return Organization.findOne({
        where: {
          id: organizationDomain.organizationId
        },
        include: ['organizationAdmins']
      });
    })
    .then(organization => {
      return Promise.all(
        _.chain(organization.toObject().organizationAdmins)
          .map(a =>
            publicKey.findOne({
              where: {
                userId: a.userId
              }
            })
          )
          .union([
            User.find({
              where: {
                id: {
                  inq: _.map(organization.toObject().organizationAdmins, a => a.userId)
                }
              }
            })
          ])
          .value()
      );
    })
    .then(data => {
      let keys = _.initial(data);
      let users = _.last(data);

      logger.debug(users);

      return {
        result: _.map(keys, k => {
          return {
            pubKey: k.key,
            admin: true,
            email: _.chain(users)
                .find(u =>
                  u.id.toString() == k.toObject().user.toString()
                )
                .get('email')
                .value()
          };
        })
      };
    })
    .catch(err => {
      if (err)
        logger.error('Organization not found', err);
      return {result: []};
    });
};
