'use strict';
const configService = require('ng-configservice');
configService.read('config/server/config.json');
var logger = require('log4js').getLogger('routes.pubKeys');

/**
 * API/Route/pubKeys
 *
 * @module API/Route/pubKeys
 * @type {Object}
 */

module.exports = server => {
  const namespace = configService.get('namespace') ? configService.get('namespace') : "ng-rt-core";
  var pubKeys = require('../backend/pubKeys')(server);

  /**
   * Get a list of assigned public Keys for a user
   *
   * @name Get a list of assigned public Keys for a user
   * @route {GET} /${namespace}/keys
   * @bodyparam {String} user.id Id of the user
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/keys`, server.ensureLoggedIn(), (req, res) => {
    logger.debug('loading list of keys');
    pubKeys.getKeys(req.user.id).then(keys => {
      res.status(200).json(keys);
    }).catch(err => {
      logger.error(err);
      res.status(500).json(err);
    });
  });

  /**
   * Save an assigned public Keys for a user
   *
   * @name Save an assigned public Keys for a user
   * @route {POST} /${namespace}/keys
   * @bodyparam {String} user.id Id of the user
   * @bodyparam {String} id Id of the user
   * @bodyparam {String} name name of the user
   * @bodyparam {String} pubkey Public Key of the user
   * @bodyparam {String} keyType Keytype liek ED25519
   * @bodyparam {String} hashPrvkey Hash of teh private key
   * @bodyparam {String} isdefault Flag for default key
   * @authentication Requires valid session token
   * @returnparam {object} keys [status] 200 = OK  500 = Error
   */
  server.post(`/${namespace}/key`, server.ensureLoggedIn(), (req, res) => {
    pubKeys
      .getKeys(req.user.id)
      .then(keys => {
        if (req.body.isdefault && keys.filter(key => key.default).length) {
          throw new Error({
            message: 'Default key already exists. Private Key already exist at another place',
            code: 1,
            error: true
          });
        }
        return keys;
      })
      .then(keys => pubKeys.save({
        name: req.body.name,
        key: req.body.pubkey,
        keyType: req.body.keyType,
        hashPrvKey: req.body.hashPrvKey,
        userId: req.user.id,
        createDate: new Date(),
        default: req.body.isdefault
      })
    )
      .then(r => res.status(200).json(r))
      .catch(err => res.status(err.code === 1 ? 200 : 500).json(err));
  });

  /**
   * Reset the default public Keys for a user: transfers
   * all unspent assets from old keypair to new public key
   *
   * @name Reset the default public Keys for a user
   * @route {POST} /${namespace}/key-reset-default
   * @bodyparam {String} id Id of the user
   * @bodyparam {String} name name of the user
   * @bodyparam {String} pubkey Public Key of the user
   * @authentication Requires valid session token
   * @returnparam {object} keys [status] 200 = OK  500 = Error
   */
  server.post(`/${namespace}/key-reset-default`, server.ensureLoggedIn(), async (req, res) => {
    try {
      if (!req.body.pubkey || !req.body.prevKeypair) {
        res.status(400).end();
        return;
      }
      const result = await pubKeys.resetDefaultKey(req.user, req.body.prevKeypair, req.body.pubkey, req.body.resetOpt);
      if (result) {
        res.json(result);
      } else {
        res.status(400).end();
      }
    } catch (err) {
      res.status(500).json(err);
    }
  });

  /**
   * Delete the a public key of a user
   *
   * @name Reset the default public Keys for a user
   * @route {DELETE} /${namespace}/key
   * @bodyparam {String} id Id of the key to delete
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.delete(`/${namespace}/key`, server.ensureLoggedIn(), (req, res) => {
    logger.debug('removing public key');
    pubKeys.delete(req.body.id, req.user.id).then(id => {
      res.status(200).json(id);
    }).catch(err => {
      res.status(400).json({message: err.message});
    });
  });

  /**
   * Updates a public Keys of a user given the publicKey
   *
   * @name Updates a public key of a user given the publicKey
   * @route {PUT} /${namespace}/key
   * @bodyparam {String} pubkey publicKey
   * @bodyparam {String} name name of the key
   * @bodyparam {boolean} isdefault Flag for default key
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.put(`/${namespace}/key`, server.ensureLoggedIn(), (req, res) => {
    pubKeys.updateByPublicKey(req.body.pubkey, req.body.name, req.body.isdefault)
    .then(r => {
      res.status(200).json(r);
    })
    .catch(err => {
      res.status(500).json(err);
    });
  });
};
