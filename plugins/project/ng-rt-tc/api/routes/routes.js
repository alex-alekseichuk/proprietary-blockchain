'use strict';

const logger = require('log4js').getLogger('ng-rt-tc.routes');
const path = require('path');
const fs = require('fs');

/**
 * API/Route/ng-rt-tc
 *
 * @module API/Route/ng-rt-tc
 * @type {Object}
 */
module.exports = {
  activate: (server, plugin, pluginInstance) => {
    // let services = server.plugin_manager.services
    // let configService = services.get('configService')
    let services = server.plugin_manager.services;
    // let log4jsService = services.get("log4jsService");
    let i18n = services.get("i18n");

    let eulap = null;
    /**
     * Find eula, if absent, then insert.
     * If value param provided, if records exists with another value, then update.
     * @param {*} server Server instance
     * @param {boolean} value Agreed or not boolean flag
     * @return {*} result Result
     */
    function findOrCreateEULA(server, value) {
      logger.debug(i18n.__('findOrCreateEULA'));
      if (eulap) {
        logger.debug(i18n.__('findOrCreateEULA, eulap exists'));
        return eulap;
      }
      logger.debug(i18n.__('findOrCreateEULA, eulap NOT exists'));
      eulap = server.models.eula.findOne()
        .then(result => {
          if (result && result.id) {
            logger.debug(i18n.__('findOrCreateEULA, found'));
            if (typeof value === 'undefined' || result.licenseAgreed == value) {
              eulap = null;
              return result;
            }
            return server.models.eula.updateAll({
              licenseAgreed: !!value || false
            })
              .then(() => {
                logger.debug(i18n.__('findOrCreateEULA, updated'));
                eulap = null;
                return server.models.eula.findOne();
              });
          }
          logger.debug(i18n.__('findOrCreateEULA, not found, result ='), result);
          return server.models.eula.upsert({
            licenseAgreed: !!value || false,
            eulaText: fs.readFileSync('./docs/eula/EULA.md')
          })
            .then(() => {
              logger.debug(i18n.__('findOrCreateEULA, upserted'));
              eulap = null;
              return server.models.eula.findOne();
            });
        })
        .catch(err => {
          logger.error(i18n.__('err ='), err);
          eulap = null;
          return err;
        });
      return eulap;
    }

    let tcp = null;
    /**
     *
     * @param {*} server Server object
     * @return {*} result Result
     */
    function findOrCreateTC(server) {
      logger.debug(i18n.__('findOrCreateTC'));
      if (tcp) {
        logger.debug(i18n.__('findOrCreateTC, tcp exists'));
        return tcp;
      }
      logger.info(i18n.__('findOrCreateTC, tcp NOT exists'));
      tcp = server.models.termsAndConditions.findOne()
        .then(result => {
          if (result && result.id) {
            logger.debug(i18n.__('findOrCreateTC, found'));
            tcp = null;
            return result;
          }
          logger.debug(i18n.__('findOrCreateTC, not found, result ='), result);
          return server.models.termsAndConditions.upsert({
            html: 'The use of the Project Blockchain Solution Platform by the end users of your organization are ' +
              'governed by the terms and conditions.The system administrator can update the terms and conditions ' +
              'for the end users of your organization.'
          })
            .then(() => {
              logger.debug(i18n.__('findOrCreateTC, upserted'));
              tcp = null;
              return server.models.termsAndConditions.findOne();
            });
        })
        .catch(err => {
          logger.error(i18n.__('err ='), err);
          tcp = null;
          return err;
        });
      return tcp;
    }

    // retrieve Plugin specific configuration
    const pluginSettings = server.plugin_manager.configs.get(plugin);

    if (process.env['EULA'])
      findOrCreateEULA(server, true);
    else
     findOrCreateEULA(server);

    // Retrieve namespace which is used in Scripting of the URL in routes below
    const namespace = pluginSettings.get('namespace');

    // retrieve the abvsolute path to store plugin specific data in config/data

    // Static route for HTML renderer
    server.use(`/${namespace}`, server.loopback.static(path.normalize(
      path.resolve(__dirname, '../../ui'))));
    
    logger.debug('Plugin Name :', plugin);
      // multi lingual supprt
    server.use('/admin/' + plugin + '/locales',
      server.loopback.static(path.resolve(__dirname, '../../locales')));

    /**
     * Accept EULA
     *
     * @name accept EULA
     * @route {GET} /${namespace}/acceptLicense
     * @authentication Requires an valid Session Token
     */
    server.get(`/${namespace}/acceptLicense`, server.ensureUserRoles(['sysadmin']), (req, res) => {
      logger.debug(i18n.__(`GET ${namespace}/acceptLicense`));
      findOrCreateEULA(server)
        .then(result => {
          logger.trace(i18n.__(`GET ${namespace}/acceptLicense, found =`), result);
          let obj = {};
          if (result && result._id) obj._id = result._id;
          return server.models.eula.upsertWithWhere(obj, {
            licenseAgreed: true
          });
        })
        .then(() => {
          return server.models.eula.findOne();
        })
        .then(result => {
          res.json({
            success: true,
            licenseAgreed: (result || {}).licenseAgreed || false
          });
        })
        .catch(err => {
          logger.error(i18n.__('err ='), err);
          res.status(500).json({
            success: false,
            error: err.message
          });
        });
    });

    /**
     * get termsAndConditions text
     *
     * @name Get terms and conditions
     * @route {GET} /${namespace}/termsAndConditions
     * @authentication Requires an valid Session Token
     */
    server.get(`/${namespace}/termsAndConditions`, server.ensureLoggedIn(), (req, res) => {
      logger.debug(i18n.__(`GET ${namespace}/termsAndConditions`));
      Promise.all([findOrCreateTC(server), findOrCreateEULA(server)])
        .then(results => {
          logger.debug(i18n.__(`GET ${namespace}/termsAndConditions, found`));
          logger.debug(i18n.__(`GET ${namespace}/eula, found`));
          res.json({
            success: true,
            termsAndConditions: (results[0] || {}).html || '',
            eulaText: (results[1] || {}).eulaText || '',
            licenseAgreed: (results[1] || {}).licenseAgreed || false
          });
        })
        .catch(err => {
          logger.error(i18n.__('err ='), err);
          res.status(500).json({
            success: false,
            error: err.message
          });
        });
    });

    /**
     * post termsAndConditions text
     *
     * @name Post terms and conditions
     * @route {Post} /${namespace}/termsAndConditions
     * @authentication Requires an valid Session Token
     */
    server.post(`/${namespace}/termsAndConditions`, server.ensureLoggedIn(), (req, res) => {
      logger.debug(i18n.__(`POST ${namespace}/termsAndConditions`));
      logger.debug(i18n.__('res.body ='), req.body);
      findOrCreateTC(server)
        .then(result => {
          logger.debug(i18n.__(`POST ${namespace}/termsAndConditions, found =`), result);
          let obj = {};
          if (result && result._id) obj._id = result._id;
          return server.models.termsAndConditions.upsertWithWhere(obj, {
            html: req.body.termsAndConditions
          });
        })
        .then(() => {
          return server.models.termsAndConditions.findOne();
        })
        .then(result => {
          res.json({
            success: true,
            termsAndConditions: (result || {}).html || ''
          });
        })
        .catch(err => {
          logger.error(i18n.__('err ='), err);
          res.status(500).json({
            success: false,
            error: err.message
          });
        });
    });

    /**
     * Accept Terms and Conditions
     *
     * @name accept terms
     * @route {GET} /${namespace}/acceptTerms
     * @authentication Requires an valid Session Token
     * @bodyparam {Array} roles List of Roles
     */
    server.get(`/${namespace}/acceptTerms`, server.ensureLoggedIn(), (req, res) => {
      logger.debug(i18n.__(`GET ${namespace}/acceptTerms`));
      server.models.User
        .findOne({where: {id: req.user.id}})
        .then(user => {
          user.termsAccepted = true;
          user.otp = false;
          user.phoneVerified = false;
          user.advanced = false;
          return user.save();
        })
        .then(user => {
          res.json({
            success: true,
            user: user
          });
        })
        .catch(err => {
          logger.error(i18n.__('GET ng-rt-components-backend/contacts error ='), i18n.__(err.message));
          res.json({
            success: false,
            error: err.message
          });
        });
    });

    /**
     * Get public part of plugin specific config
     *
     * @name Get public part of plugin specific config
     * @route {GET} /${namespace}/config
     * @authentication Requires an valid Session Token
     * @bodyparam {Object} config public part of config
     */
    server.get(`/${namespace}/settings`, server.ensureLoggedIn(), (req, res) => {
      logger.debug(i18n.__(`GET /${namespace}/settings`));
      res.json({
        success: true,
        settings: {
          requireTerms: pluginInstance.config.get('requireTerms'),
          setSessionTokenTimeout: pluginInstance.config.get('setSessionTokenTimeout')
        }
      });
    });
  },
  deactivate: {
    root: {
      path: '/ng-rt-tc',
      type: 'get'
    },
    licenseAgreed: {
      path: '/ng-rt-tc/licenseAgreed',
      type: 'get'
    },
    acceptLicense: {
      path: '/ng-rt-tc/acceptLicense',
      type: 'get'
    },
    termsAndConditionsGet: {
      path: '/ng-rt-tc/termsAndConditions',
      type: 'get'
    },
    termsAndConditionsPost: {
      path: '/ng-rt-tc/termsAndConditions',
      type: 'post'
    },
    acceptTerms: {
      path: '/ng-rt-tc/acceptTerms',
      type: 'get'
    },
    settings: {
      path: '/ng-rt-tc/settings',
      type: 'get'
    }
  }
};
