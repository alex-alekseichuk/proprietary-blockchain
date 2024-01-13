/**
 * Pubkeys Service
 */
'use strict';
const logger = require('log4js').getLogger('services.pubkey');

module.exports = app => {
  /**
   * API/Service/Pubkeys
   * Handles keys of users to sign/enc.
   * @module API/Service/Pubkeys
   * @type {object}
   */
  return {
    /**
     * Returns keys of the user
     * @param {object} user User which keys we retreive
     * @return {Promise} keys Keys of user
     */
    getKeys: function(user) {
      const PubKey = app.models.publicKey;
      return new Promise((resolve, reject) => {
        PubKey.find({where: {userId: user}}, (err, keys) => {
          if (err)
            return reject(err);
          resolve(keys);
        });
      });
    },

    /**
     * Saves key
     * @param {string} key Key to save
     * @return {Promise} Result
     */
    save: function(key) {
      const PubKey = app.models.publicKey;
      return new Promise((resolve, reject) => {
        PubKey.create(key, (err, r) => {
          if (err)
            return reject(err);
          return resolve(r);
        });
      });
    },

    /**
     * Delete key
     * @param {string} id Id of the key
     * @return {Promise} Deleted id
     */
    delete: function(id) {
      const PubKey = app.models.publicKey;
      return new Promise((resolve, reject) => {
        PubKey.destroyById(id, err => {
          if (err)
            return reject(err);
          resolve(id);
        });
      });
    },

    /**
     * Update key
     * @param {string} id Id of the key
     * @param {string} name Name of the key
     * @param {boolean} isDefault Is this key default
     * @param {string} pubkey publickey whose data is to be updated
     * @return {Promise} update result
     */
    update: function(id, name, isDefault, pubkey) {
      const PubKey = app.models.publicKey;
      return new Promise((resolve, reject) => {
        if (id) {
          PubKey.updateAll({id: id}, {name: name, default: isDefault}, (err, r) => {
            if (err)
              return reject(err);
            return resolve(r);
          });
        } else if (pubkey) {
          PubKey.updateAll({key: pubkey}, {name: name, default: isDefault}, (err, r) => {
            if (err)
              return reject(err);
            return resolve(r);
          });
        } else
          reject("No id or pubkey");
      });
    },

    /**
     * Returns key of user with email provided
     * @param {string} email Email of user to get key
     * @return {Promise} Key of the user provided
     */
    getKeyByEmail: function(email) {
      const Users = app.models.User;
      const PubKey = app.models.publicKey;
      return new Promise((resolve, reject) => {
        Users.findOne({where: {email: email}}).then(user => {
          if (user) {
            logger.debug('user found ', email, " - ", user.id);

            // const ObjectID = require('mongodb').ObjectID;

            PubKey.findOne({where: {and: [{userId: user.id}, {default: true}]}}).then(key => {
              if (key) {
                // logger.debug('key found ', key);
                resolve(key);
              } else {
                logger.debug('key not found');
                reject();
              }
            }).catch(error => {
              logger.debug('Error on get key', error);
              reject(error);
            });
          } else {
            logger.debug('user not found');
            reject();
          }
        }).catch(err => {
          logger.debug('Error on get user ', err);
          reject(err);
        });
      });
    },

    /**
     * Returns user by his key
     * @param {string} pubkey Public key
     * @return {Promise} User found by his key
     */
    getUserByKey: function(pubkey) {
      const Users = app.models.User;
      const PubKey = app.models.publicKey;
      return new Promise((resolve, reject) => {
        logger.debug("get user by key", pubkey);
        PubKey.findOne({where: {key: pubkey}}).then(result => {
          if (result) {
            logger.debug('key found ', result);
            return Users.findById(result.user).then(user => {
              if (user) {
                logger.debug('user found ', user);
                return resolve(user);
              }
              logger.debug('user not found ', result.user);
              return reject('user not found ');
            }).catch(err => {
              logger.error('Error on get user', err);
              return reject(err);
            });
          }
          logger.error('No key', pubkey);
          reject("No key", pubkey);
        }).catch(err => {
          logger.error('get pubkey error:', err);
          reject(err);
        });
      });
    }

  };
};
