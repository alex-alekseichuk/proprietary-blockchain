'use strict';

const logger = require('log4js').getLogger('routes.keypair');
const configService = require('ng-configservice');
configService.read('config/server/config.json');

/**
 * API/Route/keypair
 *
 * @module API/Route/keypair
 * @type {Object}
 */

module.exports = server => {
  const namespace = configService.get('namespace') ? configService.get('namespace') : "ng-rt-core";

  /**
   * Retrieve keypair of the user.
   * Private key is encrypted.
   *
   * @name Retrieve keypair
   * @route {GET} /${namespace}/keypair
   * @authentication Requires valid access token with logged in user
   */
  server.get(`/${namespace}/keypair`, server.ensureLoggedIn(), (req, res) => {
    server.models.keypair.findOne({where: {userId: req.user.id}})
      .then(keypair => {
        if (keypair)
          res.status(200).json(keypair);
        else
          res.status(404);
      })
      .catch(err => {
        logger.error(err);
        res.status(500).send({message: "Can't get keypair for the user."});
      })
      .then(() => {
        res.end();
      });
  });

  /**
   * Save user keypair on the server side.
   * Private key is encrypted.
   *
   * @name Save keypair
   * @route {POST} /${namespace}/keypair
   * @bodyparam {String} prvkey encrypted private key
   * @bodyparam {String} pubkey plain public key
   * @authentication Requires valid access token with logged in user
   */
  server.post(`/${namespace}/keypair`, server.ensureLoggedIn(), (req, res) => {
    server.models.keypair.findOne({where: {userId: req.user.id}})
    .then(keypair => {
      if (keypair) {
        throw new Error('Keypair already exists for the user.');
      }
      return server.models.keypair.create({
        pubkey: req.body.pubkey,
        prvkey: req.body.prvkey,
        userId: req.user.id
      });
    })
    .then(r => res.status(200).json(r))
    .catch(err => {
      res.status(500).send({message: "Can't create keypair for the user."});
      logger.error(err);
    })
    .then(() => res.end());
  });
};
