'use strict';
const configService = require('ng-configservice');
configService.read('config/server/config.json');

/**
 * API/Route/fidoCredentials
 *
 * @module API/Route/fidoCredentials
 * @type {Object}
 */

module.exports = server => {
  const namespace = configService.get('namespace') ? configService.get('namespace') : "ng-rt-core";

  var service = require("../services/fidoCredential")(server);

  /**
   * Return make credentials challenge
   *
   * @name Return make credential challenge for Registration
   * @route {GET} /${namespace}/fidoCredential/MakeCredChallenge
   * @bodyparam {String} user.id Id of the user
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/fidoCredential/MakeCredChallenge`, server.ensureLoggedIn(), (req, res) => {
    service.generateServerMakeCredChallenge(req.user.id, req.user.username)
    .catch(err => {
      res.status(500).json(err);
    })
    .then(challenge => {
      res.status(200).json(challenge);
    });
  });

  /**
   * Stores a new U2F credential for a user after challenge verification
   *
   * @name registers new u2f credential for a user: registration
   * @route {PUT} /${namespace}/fidoCredential
   * @bodyparam {String} user.id Id of the user
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.put(`/${namespace}/fidoCredential`, server.ensureLoggedIn(), (req, res) => {
    service.createOrUpdateCredential(req.body.cred, req.user.id, req.body.challenge, true)
    .catch(err => {
      res.status(err.status || 500).json(err);
    })
    .then(r => {
      res.status(200).json(r);
    });
  });

  /**
   * Get a list of registered FIDO-u2f credentials for a user
   *
   * @name Get a list of assigned Yubi Keys for a user
   * @route {GET} /${namespace}/yubikeys
   * @bodyparam {String} user.id Id of the user
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/fidoCredentials`, server.ensureLoggedIn(), (req, res) => {
    service.getCredentials(req.user.id)
    .catch(err => {
      res.status(500).json(err);
    })
    .then(credentials => {
      res.status(200).json(credentials);
    });
  });

  /**
   * Deletes an assigned Yubi Keys for a user
   *
   * @name Deletes an assigned Yubi Keys for a user
   * @route {DELETE} /${namespace}/yubikeys
   * @bodyparam {String} id Id of the yubikey
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.delete(`/${namespace}/fidoCredential`, server.ensureLoggedIn(), (req, res) => {
    service.delete(req.body, req.user.id)
    .then(id => {
      res.status(200).json({id: id});
    })
    .catch(err => {
      res.status(500).json(err);
    });
  });

  /**
   * Gets a list of options for the Yubikeys of a user
   *
   * @name Gets a list of options for teh Yubikeys of a user
   * @route {GET} /${namespace}/yubikeys/options
   * @bodyparam {String} id Id of the yubikey
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/fidoCredential/options`, server.ensureLoggedIn(), (req, res) => {
    service.getOptions(req.user.id)
    .catch(err => {
      res.status(500).json(err);
    })
    .then(options => {
      res.status(200).json(options);
    });
  });

  /**
   * Saves a list of options for teh Yubikeys of a user
   *
   * @name Saves a list of options for the Yubikeys of a user
   * @route {POST} /${namespace}/yubikeys/options
   * @bodyparam {String} id Id of the yubikey
   * @bodyparam {Boolean} true if second factor authentication u2f is enabled
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error

   */
  server.post(`/${namespace}/fidoCredential/options`, server.ensureLoggedIn(), (req, res) => {
    service.saveOptions(req.user.id, req.body.u2f)
    .catch(err => {
      res.status(500).json(err);
    }).then(result => {
      res.status(200).json(result);
    });
  });
};
