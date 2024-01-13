'use strict';
const configService = require('ng-configservice');
configService.read('config/server/config.json');

var logger = require('log4js').getLogger('routes.appKeys');

/**
 * API/Route/appKeys
 *
 * @module API/Route/appKeys
 * @type {Object}
 */

module.exports = server => {
  const namespace = configService.get('namespace') ? configService.get('namespace') : "ng-rt-core";

  let appKeys = require("../backend/appKeys")(server);

  /**
   * Get a list of the appkeys for a specific user
   *
   * @name Get a list of the appkeys for a specific user
   * @route {GET} /${namespace}/appkeys
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/appkeys`, server.ensureLoggedIn(), (req, res) => {
    appKeys.get(req.user.id).then(keys => {
      res.status(200).json(keys);
    }).catch(err => {
      logger.error(err);
      res.status(500).json(err);
    }).then(() => {
      res.end();
    });
  });

  /**
   * Creates a new appKey for a user
   *
   * @name Creates a new appKey for a user
   * @route {POST} /${namespace}/appkey
   * @bodyparam {String} appID Id of the application
   * @bodyparam {String} domainID Id of the Domain
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.post(`/${namespace}/appkey`, server.ensureLoggedIn(), (req, res) => {
    appKeys.create(req.body.appID, req.user.id, req.body.domainID).then(key => {
      res.status(200).json(key);
    }).catch(err => {
      logger.error(err);
      res.status(500).json(err);
    }).then(() => {
      res.end();
    });
  });

  /**
   * Deletes an appKey for a user
   *
   * @name Deletes an appKey for a user
   * @route {DELETE} /${namespace}/appkey
   * @bodyparam {String} id Id of the application
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.delete(`/${namespace}/appkey`, server.ensureLoggedIn(), (req, res) => {
    appKeys.delete(req.body.id).then(key => {
      res.status(200).json(key);
    }).catch(err => {
      logger.error(err);
      res.status(500).json(err);
    }).then(() => {
      res.end();
    });
  });
};
