/**
 * Routes of user-profile actions.
 */
'use strict';

const {common} = require('ng-common');
const util = common.util;

module.exports = {
  activate: loopbackApp => {
    const services = loopbackApp.plugin_manager.services;
    const configService = services.get('configService');
    const Authorisation = loopbackApp.models.authorisation;
    const userProfileService = require('../services/user-profile')(loopbackApp);

    loopbackApp.post('/change-password', loopbackApp.ensureLoggedUser(), (req, res) => {
      req.user.hasPassword(req.body.old_password).then(passwordMatched => {
        if (!passwordMatched) {
          return res.status(401).json({message: 'Old Password is incorrect.'});
        }
        return req.user.updateAttribute('password', req.body.new_password);
      }).then(() => res.end())
        .catch(err => {
          return res.status(400).json(err);
        });
    });

    loopbackApp.get('/user-profile', loopbackApp.ensureLoggedUser(), (req, res) => {
      util.promiseProps({
        domains: userProfileService.getUserDomains(req.user)
      }).then(props => {
        res.json({
          id: req.user.id,
          username: req.user.username,
          roles: req.userInfo.roles,
          fullname: req.user.fullname,
          email: req.user.email,
          phone: req.user.phone,
          theme: req.user.theme || "default",
          timezone: req.user.defaultTimezone,
          language: req.user.defaultLocale,
          emailVerified: req.user.emailVerified,
          phoneVerified: req.user.phoneVerified,
          advanced: Boolean(req.user.advanced),
          domainId: req.user.domainId || configService.get('defaultDomainId'),
          defaultLocale: req.user.defaultLocale
        });
      }).catch(err => {
        return res.status(400).json(err);
      });
    });

    loopbackApp.put('/user-profile', loopbackApp.ensureLoggedUser(), (req, res) => {
      req.user.updateAttributes(req.body).then(user => res.json(user))
        .catch(err => {
          return res.status(400).json(err);
        });
    });

    loopbackApp.put('/admin/user-profile', loopbackApp.ensureUserRoles(["admin"]), (req, res) => {
      let User = loopbackApp.models.User;

      User.findOne({
        where: {
          id: req.body.id
        }
      })
      .then(u => u.updateAttributes(req.body))
      .then(user => res.json(user))
      .catch(err => {
        return res.status(400).json({message: err.message});
      });
    });

    loopbackApp.post('/ssh-keys', loopbackApp.ensureLoggedUser(), (req, res) => {
      let User = loopbackApp.models.User;
      let keys = req.body.sshKeys;
      keys.forEach(key => {
        key.key = key.key.trim();
        key.fingerprint = require('crypto').createHash('sha256').update(key.key.trim()).digest('hex').toString('hex');
      });
      Promise.all(keys.map(k => new Promise((resolve, reject) => {
        User.findOne({
          where: {
            "sshKeys.fingerprint": k.fingerprint
          }
        }).then(u => {
          if (u && req.user.uid !== u.id)
            reject(new Error('Key already used by another user'));
          resolve();
        }).catch(err => {
          reject(err);
        });
      }))).then(() => {
        req.user.updateAttributes({sshKeys: keys}).then(user => res.json(user))
          .catch(err => {
            return res.status(400).json({message: err.message});
          });
      }).catch(err => {
        return res.status(400).json({message: err.message});
      });
    });

    loopbackApp.put('/user-domain', loopbackApp.ensureLoggedUser(), (req, res) => {
      const domainId = req.body.domainId;
      /* eslint-disable handle-callback-err */
      Authorisation.checkAuthorisation('domain', domainId, req.userInfo, (err, allowed) => {
        if (!allowed) {
          return res.status(403).json({message: 'No permissions for domain.'});
        }
        req.user.updateAttributes({
          domainId: domainId
        }).then(user => res.json(user))
          .catch(err => {
            return res.status(400).json(err);
          });
      });
    });
  },
  deactivate: {
    changePassword: {
      path: '/change-password',
      type: 'post'
    },
    getUserProfile: '/user-profile',
    updateUserProfile: {
      path: '/user-profile',
      type: 'put'
    }
  }
};
