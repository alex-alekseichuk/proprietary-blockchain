/**
 * Created by alibe on 30.06.2016.
 */
'use strict';

module.exports = server => {
  /**
   *
   * @param {*} user user
   * @param {*} isDefault isDefault
   * @return {*} promise Returns a promise
   */
  function checkUserDefaultKeys(user, isDefault) {
    return new Promise((resolve, reject) => {
      if (!isDefault)
        return resolve();
      server.models.publicKey.updateAll({userId: user}, {default: false}).then(resolve).catch(reject);
    });
  }

  /**
   * Transfer all unspent assets from one wallet to another.
   * @param {object} user user info
   * @param {object} prevKeypair old wallet {publicKey, privateKey}
   * @param {string} pubkey address of new wallet
   */
  async function transferAllAssets(user, prevKeypair, pubkey) {
    const services = server.plugin_manager.services;
    const digitalAsset = services.get('digitalAsset');
    const assetTypes = await digitalAsset.getAssetDefinitions();
    for (const assetType of assetTypes) {
      if (assetType.blockchainDriver) {
        const assets = await digitalAsset.getAssetsByOwner(prevKeypair.publicKey, assetType.digitalAsset);
        for (const asset of assets) {
          await digitalAsset.transferAsset(prevKeypair, pubkey,
            asset.txId,
            asset.metadata,
            false,
            user,
            assetType.digitalAsset,
            { // assetFormat,
              sdkVersion: "3.0",
              keyPairType: "Ed25519",
              driverType: "bdbDriver",
              encodeType: "base64"
            },
            'Commit');
        }
      }
    }
  }

  const pubKeys = {
    getKeys: async function(user) {
      return await server.models.publicKey.find({where: {userId: user}});
    },

    save: function(key) {
      return new Promise((resolve, reject) => {
        checkUserDefaultKeys(key.userId, key.default).then(() => {
          return server.models.publicKey.create(key);
        }).then(resolve).catch(reject);
      });
    },

    delete: async function(id, userId) {
      const userKeys = await this.getKeys(userId);
      if (userKeys.find(k => k.id == id))
        return await server.models.publicKey.destroyById(id);
      throw Error('Key does not belong to logged in user');
    },

    updateByPublicKey: async function(publicKey, name, isDefault) {
      if (publicKey) {
        return await server.models.publicKey.updateAll({key: publicKey}, {name: name, default: isDefault});
      }

      throw Error("No public key");
    },

    resetDefaultKey: async function(user, prevKeypair, newPubkey, resetOpt = "disable") {
      await this.updateByPublicKey(prevKeypair.publicKey, "Invalid Key", false);
      await this.updateByPublicKey(newPubkey, "Active Key", true);
      const keys = await pubKeys.getKeys(user.id);
      let prevPubkey = keys.find(key => key.key == prevKeypair.publicKey);
      let curPubKey = keys.find(key => key.key == newPubkey && key.default);
      if (prevPubkey && curPubKey) {
        await transferAllAssets(user, prevKeypair, newPubkey);
        if (resetOpt == "destroy")
          await this.delete(prevPubkey.id);
        return true;
      }
      return false;
    }
  };
  return pubKeys;
};
