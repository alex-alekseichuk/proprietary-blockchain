/**
 * Define routes for auth./sign-up/etc. at line of JWT scheme.
 */
'use strict';
const logger = require('log4js').getLogger('ng-rt-jwt-auth.routes');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const passcode = require("passcode");
const _ = require("lodash");

/* eslint-disable no-nested-ternary, handle-callback-err */

/**
 * API/Route/ng-rt-jwt-auth
 *
 * @module API/Route/ng-rt-jwt-auth
 * @type {Object}
 */

module.exports = {
  activate: (server, pluginName, pluginInstance) => {
    const services = server.plugin_manager.services;
    const i18n = services.get('i18n');
    const UserModel = server.models.User;
    const fidoService = services.get("fidoCredentials");
    const configService = services.get("configService");
    const utils = services.get("utils");
    const jwtSecret = configService.get("jwt.secret");
    const methods = require('../services')(configService, utils);
    const licenseActivation = services.get('licenseActivationClient');
    const metricsClient = services.get('metricsClient');
    services.add("auth.service", {
      generateApplicationToken: methods._generateApplicationToken
    });

    /**
     * Send user info by session token to third party app
     *
     * @name Send user info by session token to third party app
     * @route {GET} /auth/thirdinfo/:token
     * @routeparam {string} :token Token - required
     */
    server.get('/auth/thirdinfo/:token', (req, res, next) => {
      let token = req.params.token;
      let atob = str => new Buffer(str, 'base64').toString('binary');
      let uid;
      try {
        uid = JSON.parse(atob(token.split('.')[1])).uid;
      } catch (e) {
        return res.status(500).send({
          message: "Invalid token"
        });
      }
      let User = req.app.models.user;
      User.findById(uid)
        .then(user => res.send({
          user: {
            username: user.username,
            email: user.email
          }
        }))
        .catch(err => res.status(500).send({
          message: 'Error'
        }));
    });

    /**
     * Generate new access token by session token
     *
     * @name Generate new access token by session token
     * @route {POST} /auth/access
     * @bodyparam {String} req.body.token Token
     */
    server.post('/auth/access', (req, res, next) => {
      let accessTimeout = configService.get('jwt.accessTime');
      promisify(jwt.verify)(req.body.token, jwtSecret)
      .then(payload => {
        if (payload.u2f)
          throw Error("Verify 2nd factor authenticator...");
        if (!payload.uid)
          throw Error("No uid");
        return payload;  
      })
      .then(payload => {
        return promisify(UserModel.getRoleNames)(payload.uid)
          .then(roles => Promise.resolve({
            roles: roles,
            uid: payload.uid,
            username: payload.username,
            trust_level: payload.trust_level,
            domainId: payload.domainId,
            vault: payload.vault,
            sessionId: payload.sessionId
          }));
      })
      .then(accessPayload => {
        const isAdmin = accessPayload.roles.some(r => {
          return (r === "admin" || r === "sysadmin" || r === "appadmin" || r === "licadmin");
        });
        if (!licenseActivation.checkLicenseActivationOnLogin(isAdmin)) {
          if (!isAdmin) {
            throw Error("License expired");
          }
        }
        let token = jwt.sign(accessPayload, jwtSecret, {
          expiresIn: accessTimeout
        });
        res.cookie('token', token);
        res.send({
          token: token,
          expiresIn: accessTimeout
        });
      })
      .catch(err => {
        if (err.message === 'No uid') {
          logger.error('Session token: no uid');
          res.status(401).end();
        } else if (err.message === 'License expired') {
          logger.info('Session token: license expired');
          res.status(452).end();
        } else {
          logger.info('Session token: expired');
          res.status(401).end();
        }
      });
    });

    /**
     * Create new user record and generate session token to be authorized
     *
     * @name Create new user record and generate session token to be authorized
     * @route {POST} /auth/signup
     * @bodyparam {String} req.body.email Email
     * @bodyparam {String} req.body.username Username
     * @bodyparam {String} req.body.fullname Fullname
     * @bodyparam {String} req.body.password Password
     * @bodyparam {String} req.body.phone Phone
     */
    server.post('/auth/signup', (req, res, next) => {
      logger.debug('executing server.post /auth/signup');
      if (configService.get("disableSelfRegistration"))
        return res.status(500).send({
          message: "Sorry, sign up is not possible."
        });

      if (configService.get("security_level") == 2 && !req.body.phone) {
        return res.status(500).send({
          message: "Phone field needs to be filled."
        });
      }

      let User = req.app.models.user;
      User.create({
        email: req.body.email.toLowerCase(),
        fullname: req.body.fullname,
        username: req.body.username.trim(),
        password: req.body.password,
        phone: req.body.phone,
        emailVerified: false,
        phoneVerified: false
      })
        .then(user => {
          metricsClient.increment(`person, operation=new_user, user=${req.body.username.trim()}`);
          logger.debug('newUser successfull');
          methods._generateAndReplySessionToken(req, res, {
            uid: user.id,
            username: user.username,
            email: user.email
          });
        })
        .catch(err =>
          res.status(400).send({
            message: err.message
          })
        );
    });

    /**
     * Auth by specified external JWT token,
     * Create new user record and generate session token to be authorized
     * Or use already created user record.
     *
     * @name Auth by external JWT token
     * @route {POST} /auth/external
     * @bodyparam {String} req.body.token JWT token
     */
    server.post('/auth/external', (req, res, next) => {
      logger.debug('executing server.post /auth/external');
      let User = req.app.models.user;
      const secret = configService.get("jwt.externalSecret");
      const token = req.body.token;
      jwt.verify(token, secret, (err, externalUserId) => {
        // expired or incorrect token
        if (err || !externalUserId) {
          return res.status(401).end();
        }

        // try to find existing user account for this external user id
        User.findOne({
          where: {
            externalId: externalUserId
          }
        })
          .then(user => {
            if (user) {
              // the user account exists
              methods._generateAndReplySessionToken(req, res, {
                uid: user.id
              });
            } else {
              // user account doesn't exists
              // create it
              User.create({
                externalId: externalUserId
              })
                .then(user => {
                  methods._generateAndReplySessionToken(req, res, {
                    uid: user.id
                  });
                });
            }
          })
          .catch(() => {
            res.status(401).end();
          });
      });
    });

    /**
     * Handle verify-email click from email sent to the user.
     *
     * @name Handle verify-email click from email sent to the user.
     * @route {GET} /profile/verify/email/:token
     * @routeparam {string} :token Token - required
     */
    server.get('/profile/verify/email/:token', (req, res) => {
      let User = req.app.models.user;

      promisify(jwt.verify)(req.params.token, jwtSecret)
        .then(data =>
          User.update({
            id: data.userId
          }, {
            $set: {
              emailVerified: true
            }
          }, {
            allowExtendedOperators: true
          })
        )
        .then(() => {
          res.redirect('/');
        })
        .catch(err => {
          res.status(400).send({
            message: err.message
          });
        });
    });

    /**
     * Send to user email with link to verify that this email belongs to the user.
     *
     * @name Send to user email with link to verify that this email belongs to the user.
     * @route {GET} /profile/verify/email
     */
    server.get('/profile/verify/email', server.ensureLoggedIn(), (req, res) => {
      let unifiedMessage = services.get("unifiedMessaging.service");
      let mail = unifiedMessage.mail;
      logger.debug(mail);
      let token = jwt.sign({
        userId: req.user.id
      }, jwtSecret, {
        expiresIn: '24h'
      });
      let User = req.app.models.user;

      User.findOne({
        where: {
          id: req.user.id
        }
      }).then(user => {
        const host = configService.get('publicDNSName');
        return mail.send({
          to: user.email,
          html: `<p>Activate your account by confirming your email account here :
            <a href="${host}/profile/verify/email/${token}">account</a></p>`
        });
      }).then(() => {
        res.status(200).send('ok');
      }).catch(err => {
        res.status(400).send({
          message: err.message
        });
      });
    });

    /**
     * Verify phone using sms
     *
     * @name Verify phone using sms
     * @route {POST} /profile/verify/sms
     * @bodyparam {String} req.body.token Token
     */
    server.post('/profile/verify/sms', server.ensureLoggedIn(), (req, res, next) => {
      let User = req.app.models.user;
      let ok = passcode.totp.verify({
        secret: req.user.id,
        token: req.body.token,
        step: 300
      });

      if (!ok || ok.delta != 0) {
        return res.status(400).send({
          message: 'wrong token'
        });
      }

      User.update({
        id: req.user.id
      }, {
        $set: {
          phoneVerified: true
        }
      }, {
        allowExtendedOperators: true
      })
        .then(() => {
          res.status(200).send('ok');
        })
        .catch(err =>
          res.status(400).send({
            message: err.message
          })
        );
    });

    /**
     * Send phone verification sms
     *
     * @name Send phone verification sms
     * @route {GET} /profile/verify/sms
     */
    server.get('/profile/verify/sms', server.ensureLoggedIn(), (req, res, next) => {
      let unifiedMessage = services.get("unifiedMessaging.service");
      let User = req.app.models.user;
      let sms = unifiedMessage.sms;
      User.findOne({
        where: {
          id: req.user.id
        }
      })
        .then(user =>
          sms.send({
            phones: user.phone,
            message: `Project activation code: ${
              passcode.totp({
                secret: req.user.id,
                step: 300
              })
              }`
          })
        )
        .then(data => {
          res.status(200).send('ok');
        })
        .catch(err =>
          res.status(400).send({
            message: err.message
          })
        );
    });

    /**
     * Check entered login/password and generate session token
     * or generate pre-session token and redirect to u2f step
     *
     * @name Check entered login/password and generate session token
     * @route {POST} /auth/login
     * @bodyparam {String} req.body.username Username
     * @bodyparam {String} req.body.password Password
     * @bodyparam {Boolean} req.body.isLdap Flag is LDAP used
     */
    server.post('/auth/login', (req, res, next) => {
      let username = req.body.username.trim();
      let password = req.body.password;
      let isLdap = req.body.isLdap;
      let User = req.app.models.user;

      let configs = server.plugin_manager.configs;
      let settings = configs.get(pluginName);

      let authenticator = (isLdap, ldapUser) => {
        User.findOne({
          where: {
            username: username
          }
        })
          .then(user => {
            if (isLdap && !user && settings.get('ldapAutoRegister') && ldapUser) {
              return User.create({
                email: ldapUser.mail,
                username: username,
                password: password,
                phone: '',
                emailVerified: false,
                phoneVerified: false
              })
                .then(user => {
                  metricsClient.increment(`person, operation=new_user, user=${username}`);
                  logger.debug('newUser successfull');
                  return user;
                });
            }
            if (user && configService.get('serverType') === 'Login') {
              return promisify(UserModel.getRoleNames)(user.uid)
                .then(roles => {
                  if (roles.indexOf('user') !== -1 &&
                    roles.indexOf('licadmin') === -1 &&
                    roles.indexOf('admin') === -1 &&
                    roles.indexOf('sysadmin') === -1 &&
                    roles.indexOf('appadmin') === -1
                  ) {
                    return null;
                  }
                  return user;
                });
            }
            return user;
          })
          .then(user =>
            (user ? (isLdap ? Promise.resolve(true) : user.hasPassword(password)) : Promise.resolve(false))
              .then(isMatch =>
                Promise.resolve({
                  isMatch: isMatch,
                  user: user
                })
              )
          )
          .then(data => {
            if (!data.isMatch) {
              res.status(401).end();
              return;
            }
            const vaultService = services.get('vault');

            return (vaultService
              ? vaultService.login(data.user.id, password)
                .then(vaultToken => {
                  data.vault = vaultToken;
                  return data;
                })
                .catch(() => data)
              : Promise.resolve(data)
            )
              .then(data => {
                return new Promise((resolve, reject) => {
                  UserModel.getRoleNames(data.user.id, (err, roles) => {
                    if (err)
                      return reject(err);
                    data.roles = roles;
                    return resolve(data);
                  });
                });
              })
              .then(data => {
                return (data.user.u2f
                  ? fidoService.getCredentials(data.user.id)
                    .then(includeCred => {
                      return fidoService.generateServerGetCredChallenge(includeCred);
                    })
                    .then(challenge => {
                      data.u2f = challenge;
                      return data;
                    })
                    .catch(() => data)
                  : Promise.resolve(data)
                );
              })
              .then(data => {
                // generate new token and send it to the statsd
                return methods._generateAndReplySessionToken(req, res, {
                  uid: data.user.id,
                  username: data.user.username,
                  email: data.user.email,
                  domainId: data.user.domainId,
                  vault: data.vault,
                  u2f: data.u2f ? data.u2f : false,
                  remember_me: Boolean(req.body.remember_me),
                  roles: data.roles,
                  trust_level: _.reduce(
                    configService.get('securityRules'),
                    (result, value, key) => {
                      if (data.user[key + 'Verified'] && result < value) {
                        result = value;
                      }
                      return result;
                    }, 0)
                });
              });
          })
          .catch(err => res.status(500).send({
            message: err.message || ''
          }));
      };

      if (isLdap) {
        let passport = require('passport');
        let LdapStrategy = require('passport-ldapauth');
        let config = settings.get('ldap');
        config.searchFilter = config.searchFilter.replace(/\$\{username\}/, username);
        server.use(passport.initialize());
        passport.use('ldap', new LdapStrategy({
          server: config
        }));
        logger.info(`Start LDAP authorization for user '${username}'`);
        passport.authenticate('ldap', {
          session: false
        })(req, res, () => {
          if (req.user) {
            logger.info(`Founded LDAP user with username '${username}'`);
            authenticator(true, req.user);
          } else {
            logger.info(`LDAP user with username '${username}' not found`);
            res.status(401).end();
          }
        });
      } else {
        authenticator(false);
      }
    });
    /**
     * Verify u2f-signed challenge
     * it's a second step of login-u2f authentication scheme
     *
     * @name Check u2f-signed challenge and generate session token
     * @route {POST} /auth/u2f
     * @bodyparam {String} req.body.token Token
     * @bodyparam {String} req.body.cred signed challenge with u2f credential
     * @bodyparam {String} req.body.challenge challenge to be signed
     */
    server.post('/auth/u2f', (req, res) => {
      promisify(jwt.verify)(req.body.token, jwtSecret)
      .then(payload =>
        new Promise((res, rej) => payload.uid ? res(payload) : rej())
      )
      .then(payload =>
        fidoService.createOrUpdateCredential(req.body.cred, payload.uid, req.body.challenge, false)
        .then(() =>
            Promise.resolve(payload)
        )
      )
      .then(payload =>
        methods._generateAndReplySessionToken(req, res,
          {
            uid: payload.uid,
            username: payload.username,
            remember_me: payload.remember_me,
            email: payload.email,
            domainId: payload.domainId,
            trust_level: payload.trust_level,
            vault: payload.vault,
            sessionId: payload.sessionId
          })
      )
      .catch(err => {
        err ? res.status(400).json({message: err.message}) : res.status(401).end();
      });
    });

    /**
     * Logout user and remove his session and cookie objects
     *
     * @name Logout user and remove his session and cookie objects
     * @route {POST} /auth/logout
     */
    server.post('/auth/logout', (req, res) => {
      metricsClient.increment(`person, operation=logout`);
      res.clearCookie('token');
      res.clearCookie('session');
      res.end();
    });

    /**
     * Start procedure to reset forgotten password
     *
     * @name Start procedure to reset forgotten password
     * @route {POST} /auth/forgot-password
     * @bodyparam {String} req.body.email Email
     */
    server.post('/auth/forgot-password', (req, res) => {
      logger.debug('executing server.post /auth/forgot-password');

      let User = req.app.models.user;
      User.resetPasswordAsync = promisify(User.resetPassword);
      User.resetPasswordAsync({
        email: req.body.email.toLowerCase()
      })
        .then(() =>
          res.send('ok')
        )
        .catch(err =>
          res.status(500).send({
            message: err.message
          })
        );
    });

    server.models.emailTemplate.find({
      where: {
        name: 'reset_password'
      }
    })
      .then(found => {
        logger.debug('reset_password template found.length =', found.length);
        if (found.length) return logger.debug('reset_password template already exists');
        // add reset password email template
        return promisify(fs.readFile)(
          path.resolve(pluginInstance.path.absolute, "server/config/mailtemplate/resetPassword.html")
        )
          .then(data =>
            new Promise((res, rej) =>
              server.models.emailTemplate.create({
                subject: i18n.__("Reset password"),
                body: data,
                name: "reset_password",
                attachments: [{
                  filename: 'logo.jpg',
                  path: path.resolve(pluginInstance.path.absolute, 'server/config/mailtemplate/logo.jpg'),
                  cid: 'logo.jpg' // same cid value as in the html img src
                }]
              }, (err, obj) => err ? rej(err) : res(obj))
            )
          )
          .then(() => {
            logger.debug('Created new email template for resetPassword');
          });
      })
      .catch(err => {
        logger.error("Mail template write error", err);
      });

    /**
     * Reset the user's password
     *
     * @name Reset the user's password
     * @route {POST} /auth/reset-password
     * @bodyparam {String} req.body.token Token
     * @bodyparam {String} req.body.password Password
     * @bodyparam {String} req.body.confirmation Password confirmation
     */
    server.post('/auth/reset-password', (req, res, next) => { // @todo
      logger.debug('executing server.post /auth/reset-password');

      let User = req.app.models.user;
      if (!req.body.token) {
        return res.sendStatus(401);
      }

      // verify passwords match
      if (!req.body.password || !req.body.confirmation ||
        req.body.password !== req.body.confirmation) {
        return res.status(400).send('Passwords do not match');
      }
      User.relations.accessTokens.modelTo.findById(req.body.token)
        .then(accessToken => {
          if (!accessToken) {
            throw Error('Invalid Token');
          }
          return User.findById(accessToken.userId);
        })
        .then(user =>
           user.updateAttribute('password', req.body.password))
        .then(() => {
          logger.debug('> password reset processed successfully');
          res.send('ok');
        })
        .catch(err => {
          logger.debug('reset-password UnknownError');
          res.status(500).send({
            message: err.message
          });
        });
    });

    /**
     * Create new user
     *
     * @name Create new user
     * @route {POST} /auth/createuser
     * @bodyparam {String} req.body.email Email
     * @bodyparam {String} req.body.username Username
     * @bodyparam {String} req.body.password Password
     */
    server.post('/auth/createuser', server.ensureLoggedIn(), (req, res, next) => {
      logger.debug('executing server.post /auth/createuser');
      let newUser = new req.app.models.User({
        email: req.body.email.toLowerCase(),
        username: req.body.username.trim(),
        password: req.body.password
      });

      UserModel.create(newUser)
        .then(() => {
          logger.debug(222);
          res.status(200).send('ok');
        })
        .catch(err => {
          logger.debug('newUser Error');
          res.status(400).send({
            message: err.message
          });
        });
    });

    /**
     * Remove specific user by id
     *
     * @name Remove specific user by id
     * @route {POST} /auth/removeuser
     * @bodyparam {String} req.body.userId User id
     */
    server.post('/auth/removeuser', server.ensureLoggedIn(), (req, res, next) => {
      if (!req.body.userId) {
        return res.status(400).send({
          message: 'User id is not defined'
        });
      }

      UserModel.remove({
        id: req.body.userId
      })
        .then(() =>
          res.status(200).send('ok')
        )
        .catch(err => {
          logger.debug('removeUser Error');
          res.status(400).send({
            message: err.message
          });
        });
    });

    /**
     * Application login
     *
     * @name Application login
     * @route {POST} /auth/applogin
     * @bodyparam {String} req.body.appKey Application key
     * @bodyparam {String} req.body.appID Application id
     */
    server.post('/auth/applogin', (req, res, next) => {
      logger.debug('executing /auth/applogin');
      let appKey = req.body.appKey;
      let appID = req.body.appID;
      let AppKeys = req.app.models.appKey;
      let key;
      logger.debug('appkey :', appKey);
      logger.debug('AppKeys :', AppKeys);
      logger.debug('appID :', appID);

      AppKeys.findOne({
        where: {
          appID: appID,
          appKey: appKey
        }
      })
        .then(k => {
          logger.debug('Appkey model :', k);
          if (k) {
            key = k;
            return promisify(UserModel.getRoleNames)(key.userId);
          }
          res.status(401).end();
        }).then(roles => methods._generateApplicationToken(req, res, { // generate new token and send it to the logout
          application: appID,
          domainID: key.domainID,
          uid: key.user,
          roles: roles
        }))
        .catch(err => {
          var message;
          if (err.message)
            logger.error('Unkown error : ', err);
          message = err.message;
          res.status(500).send({
            message: message
          });
        });
    });

    server.get('/auth/sshlogin', (req, res, next) => {
      let fgrprnt = req.query.key;
      let user;
      if (!fgrprnt)
        return res.status(401).end();
      UserModel.findOne({
        where: {
          "sshKeys.fingerprint": fgrprnt
        }
      })
        .then(u => {
          user = u;
          return promisify(UserModel.getRoleNames)(user.id);
        }).then(roles =>
          user && user.sshKeys && user.sshKeys.length > 0 ?
            methods._generateSshTokens(req, res, {
              uid: user.id,
              username: user.username,
              email: user.email,
              domainId: user.domainId,
              roles: roles,
              trust_level: _.reduce(
                configService.get('securityRules'),
                (result, value, key) => {
                  if (user[key + 'Verified'] && result < value) {
                    result = value;
                  }
                  return result;
                }, 0)
            }, user.sshKeys, req.query.key) :
            res.status(401).end()
        ).catch(err => err ? res.status(400).json({
          message: err.message
        }) : res.status(401).end());
    });

    server.post(`/auth/confirmRegister`, (req, res) => {
      server.models.emailTemplate.find({
        where: {
          name: 'register_confirm'
        }
      })
        .then(found => {
          logger.debug('register_confirm template found.length =', found.length);
          if (found.length) return logger.debug('reset_password template already exists');
          // add register confirmation email template
          return promisify(fs.readFile)(
            path.resolve(pluginInstance.path.absolute, "server/config/mailtemplate/registerConfirm.html")
          )
            .then(data =>
              new Promise((res, rej) =>
                server.models.emailTemplate.create({
                  subject: i18n.__("Confirm Registration"),
                  body: data,
                  name: "register_confirm",
                  attachments: [{
                    filename: 'logo.jpg',
                    path: path.resolve(pluginInstance.path.absolute, 'server/config/mailtemplate/logo.jpg'),
                    cid: 'logo.jpg' // same cid value as in the html img src
                  }]
                }, (err, obj) => err ? rej(err) : res(obj))
              )
            )
            .then(() => {
              return logger.debug('Created new email template for resetPassword');
            });
        }).then(() => {
          server.models.uiObserver.notifyObserversOf("USER_registration_confirm", {
            email: req.body.email
          }).then(email => {
            res.status(200).send(email);
          })
            .catch(err => {
              res.status(500).send(err);
              logger.error("Mail template write error", err);
            });
        });
    });
  },

  deactivate: {
    "transparent": {
      path: "/auth/transparent"
    },
    "access": {
      path: "/auth/access",
      type: "post"
    },
    "signup": {
      path: "/auth/signup",
      type: "post"
    },
    "login": {
      path: "/auth/login",
      type: "post"
    },
    "logout": {
      path: "/auth/logout",
      type: "post"
    },
    "forgot-password": {
      path: "/auth/forgot-password",
      type: "post"
    },
    "reset-password": {
      path: "/auth/reset-password",
      type: "post"
    },
    "createuser": {
      path: "/auth/createuser",
      type: "post"
    },
    "removeuser": {
      path: "/auth/removeuser",
      type: "delete"
    }
  }
};
