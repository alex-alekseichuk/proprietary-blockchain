'use strict';

const logger = require('log4js').getLogger('routes.storedKeys');
const uuid = require('uuid');
const serviceManager = require('../services');

/**
 * API/Route/storedkeys
 *
 * @module API/Route/storedkeys
 * @type {Object}
 */

module.exports = server => {
  const configService = serviceManager.get('initialConfigService');
  const i18n = serviceManager.get('i18n');
  const namespace = configService.get('namespace') || "ng-rt-core";

  /**
   * Save storedKey record for specific keypair (pub, prv) and logged in user.
   *
   * @name Save storedKey record for specific keypair (pub, prv) and logged in user.
   * @route {POST} /${namespace}/storedkey
   * @bodyparam {String} pubKey Id of corresponding public key
   * @bodyparam {String} key encrypted private key
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.post(`/${namespace}/storedkey`, server.ensureLoggedIn(), (req, res) => {
    const storedKeys = serviceManager.get('storedKeys');
    server.models.publicKey.findOne({where: {key: req.body.pubKey, userId: req.user.id}})
    .then(key => {
      if (!key) {
        throw new Error('Public key not found');
      }
      logger.debug(i18n.__(`Found pubkey ${key.id}`));
      return storedKeys.save(req.user, key.id.toString(), {
        key: req.body.key,
        pubKey: req.body.pubKey,
        keyId: key.id.toString(),
        name: key.name,
        userId: req.user.id,
        createDate: new Date()
      });
    })
    .then(r => res.status(200).json(r))
    .catch(err => res.status(500).json(err));
  });

  /**
   * Load all storedKey records of logged in user.
   *
   * @name Load all storedKey records of logged in user.
   * @route {GET} /${namespace}/storedkeys
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/storedkeys`, server.ensureLoggedIn(), (req, res) => {
    const storedKeys = serviceManager.get('storedKeys');
    storedKeys.loadAll(req.user)
      .then(keys => res.status(200).json(keys))
      .catch(err => {
        logger.error(err);
        res.status(500).json(err);
      });
  });

  /**
   * Load storedKey record of default keypair (pub, prv) of logged in user.
   *
   * @name Load storedKey record of default keypair (pub, prv) of logged in user.
   * @route {GET} /${namespace}/storedkey
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/storedkey`, server.ensureLoggedIn(), (req, res) => {
    const storedKeys = serviceManager.get('storedKeys');
    var keyId;
    server.models.publicKey.findOne({where: {default: true, userId: req.user.id}})
      .then(key => {
        if (!key) {
          res.status(404).end();
          return;
        }
        keyId = key.id.toString();
        logger.debug(`found default key id: ${key.id}`);
        return storedKeys.load(req.user, keyId)
          .then(record => {
            res.status(200).json(record);
          })
          .catch(err => {
            logger.error(err.message);
            res.status(500).json({message: err.message});
          });
      });
  });

  /**
   * Save storedKey, which would be restored later on another client by special token sent via Email.
   *
   * @name Save storedKey, which would be restored later on another client by special token sent via Email.
   * @route {POST} /${namespace}/storekeybymail
   * @bodyparam {String} pubKey Id of corresponding public key
   * @bodyparam {String} key encrypted private key
   * @authentication Requires valid session token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.post(`/${namespace}/storekeybymail`, server.ensureLoggedUser(), (req, res) => {
    const storedKeys = serviceManager.get('storedKeys');
    let EmailSend = server.models.emailSend;
    let baseUrl = configService.get("publicDNSName");
    let token = uuid.v4();
    EmailSend.create({emails: req.user.email, template: "storekey", payload: {
      url: `${baseUrl}/admin/#!/admin/keys/${token}`
    }});
    server.models.publicKey.findOne({where: {key: req.body.pubKey, userId: req.user.id}})
    .then(key => {
      if (!key) {
        throw new Error('Public key not found');
      }
      return storedKeys.save(req.user, key.id.toString(), {
        key: req.body.key,
        pubKey: req.body.pubKey,
        keyId: key.id.toString(),
        name: key.name,
        userId: req.user.id,
        createDate: new Date(),
        token: token
      });
    })
    .then(r => res.status(200).json(r))
    .catch(err => res.status(500).json(err))
    .then(() => res.end());
  });
};
