/**
 * YubiKeys Service
 */
'use strict';
const logger = require('log4js').getLogger('service.yubikey');
const YubikeyBackend = require('../backend/yubikey');

const clientId = '29285';
const secretId = '7bVWEcLCdQmEOmCEHPKl4wAY5Qk=';
const yubikey = new YubikeyBackend(clientId, secretId);

module.exports = (app, utils) => {
  /**
   * API/Service/YubiKey
   * handles yubikeys of user for 2-factor authentication.
   * @module API/Service/YubiKey
   * @type {object}
   */
  return {
    /**
     * Returns keys of user
     * @param {string} userId - Id of the user
     * @return {object} keys - Keys of the user
     */
    getKeys: function(userId) {
      return new Promise((resolve, reject) => {
        app.models.yubiKey.find({where: {userId: userId}}, (err, keys) => {
          if (err)
            return reject(err);
          resolve(keys);
        });
      });
    },

    /**
     * Save otp for user
     * @param {string} otp otp to save
     * @param {string} userId Id of the user
     * @return {Promise} res Create yubiKey
     */
    save: function(otp, userId) {
      const deviceKey = otp.substring(1, 12);
      return app.models.yubiKey.findOne({where: {userId: userId, key: deviceKey}}).then(key => {
        if (key) {
          logger.error('key is already registered');
          throw new utils.ErrorPayload({status: 400, message: 'This yubikey is already registered'});
        }
        logger.debug(otp);
        return yubikey.verify(otp).then(() => {
          const key = {
            key: deviceKey,
            userId: userId,
            createDate: new Date()
          };
          logger.debug(key);
          return app.models.yubiKey.create(key);
        });
      }).catch(err => {
        logger.error(err);
      });
    },

    /**
     * Delete yubiKey by id
     * @param {string} id Id of the yubiKey to delete
     * @return {string} id Id of the yuiKey deleted
     */
    delete: function(id) {
      return new Promise((resolve, reject) => {
        app.models.yubiKey.destroyById(id, err => {
          if (err)
            return reject(err);
          resolve(id);
        });
      });
    },

    /**
     * Verify otp and user
     * @param {String} otp - otp to verity
     * @param {String} userId - Id of the user to verify
     * @return {Promise} Is this verified
     */
    verify: function(otp, userId) {
      const deviceKey = otp.substring(1, 12);
      return app.models.yubiKey.findOne({where: {userId: userId, key: deviceKey}}).then(key => {
        if (!key)
          throw new utils.ErrorPayload({message: 'Incorrect or unregistered key'});
        return yubikey.verify(otp).then(() => {
          return true;
        });
      });
    },

    /**
     * Returns options of the user
     * @param {String} userId ID of the user
     * @return {Promise} res Contains options of the usr
     */
    getOptions: function(userId) {
      return app.models.user.findById(userId).then(user => {
        return {otp: user.otp};
      });
    },

    /**
     * Saves options for user
     * @param {String} userId Id of the user to save options
     * @param {String} otp Options to save
     * @return {Promise} empty object
     */
    saveOptions: function(userId, otp) {
      return app.models.user.findById(userId).then(user => {
        user.updateAttribute('otp', otp);
        return {};
      });
    }

  };
};
