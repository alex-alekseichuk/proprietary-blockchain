'use strict';
const configService = require('ng-configservice');
configService.read('config/server/config.json');

/**
 * API/Route/yubiKeys
 *
 * @module API/Route/yubiKeys
 * @type {Object}
 */

module.exports = server => {
  const namespace = configService.get('namespace') ? configService.get('namespace') : "ng-rt-core";

  var service = require("../services/yubikeys")(server);

  /**
   * Get a list of assigned Yubi Keys for a user
   *
   * @name Get a list of assigned Yubi Keys for a user
   * @route {GET} /${namespace}/yubikeys
   * @bodyparam {String} user.id Id of the user
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/yubikeys`, server.ensureLoggedIn(), (req, res) => {
    service.getKeys(req.user.id).then(keys => {
      res.status(200).json(keys);
    }).catch(err => {
      res.status(500).json(err);
    }).then(() => {
      res.end();
    });
  });

  /**
   * Saves an assigned Yubi Keys for a user
   *
   * @name Get a list of assigned Yubi Keys for a user
   * @route {POST} /${namespace}/yubikeys
   * @bodyparam {String} user.id Id of the user
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.post(`/${namespace}/yubikeys`, server.ensureLoggedIn(), (req, res) => {
    service.save(req.body.otp, req.user.id).then(r => {
      res.status(200).json(r);
    }).catch(err => {
      res.status(err.status || 500).json(err);
    }).then(() => {
      res.end();
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
  server.delete(`/${namespace}/yubikeys`, server.ensureLoggedIn(), (req, res) => {
    service.delete(req.body.id).then(id => {
      res.status(200).json({id: id});
    }).catch(err => {
      res.status(500).json(err);
    }).then(() => {
      res.end();
    });
  });

  /**
   * Gets a list of options for teh Yubikeys of a user
   *
   * @name Gets a list of options for teh Yubikeys of a user
   * @route {GET} /${namespace}/yubikeys/options
   * @bodyparam {String} id Id of the yubikey
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/yubikeys/options`, server.ensureLoggedIn(), (req, res) => {
    service.getOptions(req.user.id).then(options => {
      res.status(200).json(options);
    }).catch(err => {
      res.status(500).json(err);
    }).then(() => {
      res.end();
    });
  });

  /**
   * Saves a list of options for teh Yubikeys of a user
   *
   * @name Saves a list of options for teh Yubikeys of a user
   * @route {POST} /${namespace}/yubikeys/options
   * @bodyparam {String} id Id of the yubikey
   * @bodyparam {String} otp One time password
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error

   */
  server.post(`/${namespace}/yubikeys/options`, server.ensureLoggedIn(), (req, res) => {
    service.saveOptions(req.user.id, req.body.otp).then(result => {
      res.status(200).json(result);
    }).catch(err => {
      res.status(500).json(err);
    }).then(() => {
      res.end();
    });
  });
};
