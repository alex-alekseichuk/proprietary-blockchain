'use strict';

const logger = require('log4js').getLogger('common/models/user.js');

module.exports = function(user) {
  user.on('resetPasswordRequest', function(info) {
    const app = user.app;
    const uiObserver = app.models.uiObserver;
    uiObserver.notifyObserversOf("USER_reset_password", {email: info.email, token: info.accessToken.id});
  });

  user.observe('before save', function(ctx, next) {
    if (ctx.isNewInstance && ctx.instance && ctx.instance.emailVerified == undefined) {
      ctx.instance.emailVerified = false;
    }

    next();
  });

  user.observe('after save', function(ctx, next) {
    let app = user.app;
    if (!app.plugin_manager || !app.plugin_manager.services) {
      next();
      return;
    }
    let services = app.plugin_manager.services;
    let configService = services.get('configService');
    let i18n = services.get('i18n');
    let Role = app.models.Role;
    let RoleMapping = app.models.RoleMapping;
    let roleUtils = require('../utils/roles')(Role);
    let defaultRole = configService.get('defaultRole') || 'user';

    logger.trace(i18n.__('User: after save'));

    if (!ctx.isNewInstance || !ctx.instance) {
      next();
      return;
    }
    let newUser = ctx.instance;

    logger.trace(i18n.__('User'), newUser);

    if (newUser.system) {
      next();
      return;
    }

    roleUtils.getRoleByName(defaultRole)
      .then(role => {
        let principalData = {
          principalType: RoleMapping.USER,
          principalId: newUser.id
        };
        return role.principals.create(principalData);
      })
      .then(principal => {
        logger.debug(i18n.__('Added role "%s" to user "%s"', defaultRole, newUser.username));
        next();
      })
      .catch(err => {
        logger.error(err);
        next(err);
      });
  });

  user.observe('access', function limitByStatus(ctx, next) {
    if (!ctx.query.where)
      ctx.query.where = {};
    ctx.query.where.status = {neq: 'disabled'};
    next();
  });
};
