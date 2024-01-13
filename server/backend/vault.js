/**
 * Vault backend
 * The code is commented because `node-vault` module is excluded from dependencies.
 * `node-vault` has invalid license.
 */
'use strict';
// const logger = require('log4js').getLogger('backend.vault');
// const vault = require("node-vault");
(() => {
  const factory = (configService, i18n) => {
    // const options = {
    //   apiVersion: 'v1',
    //   endpoint: configService.get('keyValueStorage.url', 'http://127.0.0.1:8200')
    // };
    const login = (userId, password) => {
      return Promise.resolve();
      // const conn = vault(options);
      // return conn.userpassLogin({username: userId, password})
      //   .then(result => {
      //     if (result && result.auth && result.auth.client_token)
      //       return result.auth.client_token;
      //     throw new Error('No token');
      //   });
    };
    const write = (token, userId, key, record) => {
      // logger.debug(i18n.__(`write to secret/users/${userId}/${key}`));
      // const conn = vault(Object.assign({token}, options));
      // return conn.write(`secret/users/${userId}/${key}`, record);
    };
    const read = (token, userId, key) => {
      // const conn = vault(Object.assign({token}, options));
      // return conn.read(`secret/users/${userId}/${key}`)
      //   .then(result => result.data);
    };
    const listKeys = (token, userId, key) => {
      return [];
      // const conn = vault(Object.assign({token}, options));
      // return conn.list(`secret/users/${userId}/${key}`)
      //   .then(result => result.data.keys);
    };

    /**
     * API/Backend/Vault
     *
     * @module API/Backend/Vault
     * @type {object}
     */
    return {
      /**
       * Login at Vault server via userpass auth scheme.
       * Project userId is used as username and Project password as password.
       *
       * @method login
       * @param {String} userId Project userId
       * @param {String} password Project password
       * @return {Promise<String>} Vault auth. token
       */
      login,

      /**
       * Write a record under specific key in user's scope.
       *
       * @method write
       * @param {String} token Vault auth. token for the user
       * @param {String} userId Project user ID
       * @param {String} key Relative to user's namespace key
       * @param {Object} record Data for saving in Vault storage
       * @return {void}
       */
      write,

      /**
       * Read a record from Vault storage.
       *
       * @method read
       * @param {String} token Vault auth. token for the user
       * @param {String} userId Project user ID
       * @param {String} key Relative to user's namespace key
       * @return {Promise<Object>} Data saved under the key
       */
      read,

      /**
       * List all keys under specific prefix/branch.
       *
       * @method listKeys
       * @param {String} token Vault auth. token for the user
       * @param {String} userId Project user ID
       * @param {String} key Relative to user's namespace key
       * @return {Promise<Array<String>>} Array of keys
       */
      listKeys
    };
  };
  module.exports = factory;
  factory.__components = 'vault';
  factory.__dependencies = ['configService', 'i18n'];
})();
