/**
 * Stored Keys service.
 * storedKeys record is an encrypted version of keypair (pub, prv).
 * It's saved on the server to be restored/decrypted on the client for further usage.
 *
 * The logic of how to get data and where to get it from
 * is here in code.
 * And it's not universal.
 * It's specific for storedKey feature.
 * It would be better to create keyValue storage,
 * as universal layer, and put the logic there,
 * so, it should have standard scheme/behaviour for both
 * loopback and vault key-value features/modules.
 */
'use strict';
const logger = require('log4js').getLogger('services.storedKeys');

module.exports = (loopbackApp, configService, i18n, vault) => {
  /**
   * API/Service/storedKeys
   *
   * @module API/Service/storedKeys
   * @type {Object}
   */
  return {
    /**
     * Save storedKey record under specific context/user.
     *
     * @method save
     * @memberOf API/Service/storedKeys
     * @param {String} ctx project context with info about user
     * @param {String} publicKeyId ID of corresponding public key
     * @param {object} record data of the record to save
     * @return {Promise} storedKey record
     */
    save,

    /**
     * Load specific storedKey record.
     *
     * @method load
     * @memberOf API/Service/storedKeys
     * @param {String} ctx project context with info about user
     * @param {String} publicKeyId ID of corresponding public key
     * @return {Promise} storedKey record
     */
    load,

    /**
     * Load all storedKey records for specified context/user.
     *
     * @method loadAll
     * @memberOf API/Service/storedKeys
     * @param {String} ctx project context with info about user
     * @return {Promise} array of storedKey records
     */
    loadAll
  };

  /**
   * ToDo
   * @param {*} ctx ctx
   * @param {*} publicKeyId publicKeyId
   * @param {*} record record
   * @return {*} vault vault
   */
  function save(ctx, publicKeyId, record) {
    const type = configService.get('keyValueStorage.type', 'loopback');

    logger.debug(i18n.__(`save type: ${type}`));

    if (type === 'vault') {
      logger.debug(i18n.__(`save to vault token: ${ctx.vault}, userId: ${ctx.id}`));
      return vault.write(ctx.vault, ctx.id, `storedKey/${publicKeyId}`, record);
    }

    return loopbackApp.models.storedKey.create(record);
  }

  /**
   * ToDo
   * @param {*} ctx ctx
   * @param {*} publicKeyId publicKeyId
   * @return {*} vault vault
   */
  function load(ctx, publicKeyId) {
    const type = configService.get('keyValueStorage.type', 'loopback');

    if (type === 'vault') {
      return vault.read(ctx.vault, ctx.id, `storedKey/${publicKeyId}`);
    }

    return loopbackApp.models.storedKey.find({where: {userId: ctx.id}})
      .then(storedKeys => {
        var storedKey = storedKeys.find(function(k) {
          return k.keyId === publicKeyId;
        });
        if (!storedKey) {
          throw new Error('Default Private key not found');
        }
        return storedKey;
      });
  }

  /**
   * ToDo
   * @param {*} ctx ctx
   * @return {*} vault vault
   */
  function loadAll(ctx) {
    const type = configService.get('keyValueStorage.type', 'loopback');

    if (type === 'vault') {
      return vault.listKeys(ctx.vault, ctx.id, 'storedKey/')
        .then(keys => Promise.all(keys.map(key => vault.read(ctx.vault, ctx.id, `storedKey/${key}`))));
    }

    return loopbackApp.models.storedKey.find({where: {userId: ctx.id}});
  }
};
module.exports.__components = 'storedKeys';
module.exports.__dependencies = ['loopbackApp', 'configService', 'i18n', 'vault'];
