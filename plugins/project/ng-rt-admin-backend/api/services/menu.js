'use strict';

const logger = require('log4js').getLogger('menu.js');
let configService;
let serverType;

module.exports = app => {
  const UserModel = app.models.User;
  const RouteModel = app.models.route;

  configService = app.plugin_manager.services.get("configService");
  serverType = configService.get('serverType');

  return {
    getMenu: function(name, user, isProfile) {
      return new Promise((resolve, reject) => {
        if (!isProfile) {
          isProfile = false;
        }

        RouteModel.find({
          where: {
            module: name,
            profile: isProfile
          },
          order: 'order ASC, caption ASC'
        }, (err, routes) => {
          if (err) reject(err);
          // logger.debug(routes);
          let menu = {};
          let checkTrustLevel = configService.get("trust_level.active_trust_levels");
          let userTrustLevel = user.trust_level ? user.trust_level : 0;
          let pluginTrustLevel = 0;
          if (isProfile) {
            menu[0] = [];
          } else {
            user.roles.forEach(role => {
              menu[role] = [];
            });
          }
          processMenu(app, menu, routes, user.roles, checkTrustLevel, userTrustLevel, pluginTrustLevel).then(() => {
            let ret = [];
            Object.keys(menu).forEach(key => {
              ret.push({
                name: key,
                items: menu[key]
              });
            });
            return resolve(ret);
          });
        });
      });
    },
    getFavorites: user => {
      return new Promise((resolve, reject) => {
        UserModel.findById(user.id).then(userModel => {
          if (userModel)
            return resolve(userModel.favorites);
        }).catch(reject);
      });
    },
    addFavorite: (route, user) => {
      const i18n = app.plugin_manager.services.get("i18n");
      return new Promise((resolve, reject) => {
        UserModel.findById(user.id).then(user => {
          if (user) {
            if (!user.favorites)
              user.favorites = [];
            if (user.favorites.some(fv => {
              return fv.type === route.type &&
                fv.route === route.route &&
                fv.module === route.module &&
                fv.caption === route.caption;
            })) {
              return reject(i18n._("Error: Favorites already added"));
            }
            user.favorites.push(route);
            user.save().then(resolve).catch(reject);
          }
        }).catch(reject);
      });
    },
    removeFavorite: (route, user) => {
      return new Promise((resolve, reject) => {
        UserModel.findById(user.id).then(user => {
          if (user) {
            if (!user.favorites)
              return resolve();
            user.favorites.forEach((fv, index) => {
              if (fv.type === route.type && fv.route === route.route &&
                  fv.module === route.module && fv.caption === route.caption) {
                user.favorites.splice(index, 1);
              }
            });
            user.save().then(resolve).catch(reject);
          }
        }).catch(reject);
      });
    }

  };
};

/**
 * @param {Object} app Application instance
 * @param {Object} menu Menu
 * @param {Object} items Items
 * @param {Object} roles Roles
 * @param {Bool} checkTrustLevel check trust level
 * @param {Object} userTrustLevel user trust level
 * @param {Object} pluginTrustLevel plugin trust level
 * @return {Object} Promise
 * @ignore
 */
function processMenu(app, menu, items, roles, checkTrustLevel, userTrustLevel, pluginTrustLevel) {
  const i18n = app.plugin_manager.services.get("i18n");
  return new Promise((resolve, reject) => {
    /**
     * @param {Number} i index
     * @return {Object} result
     */
    function processItem(i) {
      if (i >= items.length) {
        return resolve();
      }

      let item = items[i];
      if (item.href) {
        if (item.href.startsWith('pluginsdisplay')) {
          item.href = "pluginsdisplay/" + item.id;
        }
      }

      if (item.caption) {
        item.caption = i18n.__(item.caption);
      }

      isAllowed(item, roles, checkTrustLevel, userTrustLevel, pluginTrustLevel).then(prRoles => {
        if (prRoles) {
          prRoles.forEach(r => {
            if (item.parent) {
              var parent = getItem(menu[r], item.parent);
              if (parent) {
                if (!parent.items)
                  parent.items = [];
                parent.items.push(item);
              }
            } else
              menu[r].push(item);
          });
        } else {
          Object.keys(menu).forEach(r => {
            menu[r].push(item);
          });
        }
        return processItem(i + 1);
      }).catch(() => processItem(i + 1));
    }

    processItem(0);
  });
}

/**
 * @param {Array} menu menu
 * @param {String} id id
 * @return {String} menu item
 * @ignore
 */
function getItem(menu, id) {
  for (var i = 0; i < menu.length; i++) {
    if (menu[i].id == id) {
      return menu[i];
    }
    if (menu[i].items) {
      var child = getItem(menu[i].items, id);
      if (child)
        return child;
    }
  }
  return null;
}

/**
 * @param {Object} item item
 * @param {Object} roles roles
 * @param {Bool} checkTrustLevel check trust level
 * @param {Object} trustLevel trust level
 * @param {Object} pluginTrustLevel plugin trust level
 * @return {Object} promise
 * @ignore
 */
function isAllowed(item, roles, checkTrustLevel, trustLevel, pluginTrustLevel) {
  return new Promise((resolve, reject) => {
    logger.trace("check route", item.route, roles, item.roles, "checkTrustLevel",
      checkTrustLevel, "trustLevel", trustLevel, "pluginTrustLevel", pluginTrustLevel);

    if (checkTrustLevel && (item.trustLevel && item.trustLevel > trustLevel || pluginTrustLevel > item.trustLevel)) {
      return reject();
    }

    if (
      serverType === 'Login' &&
      roles.indexOf('user') !== -1 &&
      roles.indexOf('licadmin') === -1 &&
      roles.indexOf('admin') === -1 &&
      roles.indexOf('sysadmin') === -1 &&
      roles.indexOf('appadmin') === -1 &&
      item.roles &&
      item.roles.indexOf('user') !== -1 &&
      item.roles.indexOf('licadmin') === -1 &&
      item.roles.indexOf('admin') === -1 &&
      item.roles.indexOf('sysadmin') === -1 &&
      item.roles.indexOf('appadmin') === -1
    ) {
      return reject();
    }

    if (!item.roles) {
      return resolve();
    }

    let allowed = false;
    let prRoles = [];

    item.roles.forEach(role => {
      roles.forEach(r => {
        if (r === role) {
          allowed = true;
          prRoles.push(r);
        }
      });
    });

    if (allowed) {
      return resolve(prRoles);
    }

    return reject("Not allowed");
  });
}
