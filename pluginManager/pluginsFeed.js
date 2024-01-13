'use strict';
const logger = require('log4js').getLogger('pluginsFeed');

const assetFormat = {
  sdkVersion: "3.0",
  keyPairType: "Ed25519",
  driverType: "bdbDriver",
  encodeType: "base64"
};

const MESSAGES = {
  UPDATE: "PLUGIN_UPDATE",
  UPDATED: "PLUGIN_UPDATED",
  INSTALLED: "PLUGIN_INSTALLED",
  UNINSTALLED: "PLUGIN_UNINSTALLED",
  ACTIVATED: "PLUGIN_ACTIVATED",
  DEACTIVATED: "PLUGIN_DEACTIVATED",
  REMOVED: "PLUGIN_REMOVED",
  ADDED: "PLUGIN_ADDED"
};

const parseMessage = message => {
  if (!message)
    return;
  if (typeof message === 'string') {
    try {
      message = JSON.parse(message);
    } catch (err) {
      logger.error(err);
    }
  }
  return message;
};

module.exports = (services, manager) => {
  const configService = services.get('configService');
  const i18n = services.get('i18n');
  const uniqueId = require("crypto").randomBytes(16).readInt16BE();
  const {getStorage, install, uninstall, deactivate, activate, remove, updatePlugin, appRepo, compareVersions, hasUpdates, getPlugin} = manager;

  const processPluginUpdate = async asset => {
    let pluginName = asset.pluginName;
    let result = await hasUpdates(asset.pluginName);
    if (result.has)
      return updatePlugin(pluginName, false, null, false, true);
    if (result.reactivate) {
      logger.trace("reactivate");
      let pluginApp = await appRepo.findOne(pluginName);
      if (pluginApp.active) {
        await deactivate(pluginName);
        return activate(pluginName);
      }
    }
  };

  const processPluginActivate = async asset => {
    let pluginName = asset.pluginName;
    return activate(pluginName, false);
  };

  const processPluginDeactivate = async asset => {
    let pluginName = asset.pluginName;
    return deactivate(pluginName, true, false);
  };

  const processPluginRemove = async asset => {
    let pluginName = asset.pluginName;
    return remove(pluginName, false, false);
  };

  const processPluginInstall = async asset => {
    let pluginName = asset.pluginName;
    let payload = asset.payload;
    let order;
    let parameters;
    if (payload) {
      order = payload.order;
      parameters = payload.parameters;
    }
    return install(pluginName, order, parameters, false);
  };

  const processPluginUninstall = async asset => {
    let pluginName = asset.pluginName;
    return uninstall(pluginName, false, false);
  };

  const processPluginPublish = async (asset, digitalAssetService) => {
    let chunkAssets;
    if (asset.chunkCount > 1) {
      chunkAssets = await digitalAssetService.findAssetByProperty('publishPluginId', asset.publishPluginId, 'plugin_feed');
    } else {
      chunkAssets = [asset];
    }
    if (chunkAssets.length < asset.chunkCount)
      return;
    let pluginName = asset.pluginName;
    let storage = getStorage();
    let buf = [].concat.apply([], chunkAssets.sort((a, b) => a.data.chunkIndex - b.data.chunkIndex).map(c => c.data.buffer.data));
    let zipFilePath = await storage.savePluginZip(pluginName, buf);
    let pluginVersion = asset.version;
    let manifest = await storage.getManifest(pluginName);
    let exist = false;
    let needUpdatePlugin = false;
    if (manifest) {
      exist = true;
      let lv = await storage.version(pluginName);
      needUpdatePlugin = compareVersions(pluginVersion, manifest.version + lv);
    }
    const addPlugin = async (needInstall, needActivate) => {
      await storage.unpack(zipFilePath, null, pluginName);
      if (needInstall) {
        try {
          await install(pluginName);
        } catch (e) {
          logger.error(i18n.__('Error on publish/install'), e);
        }
        if (needActivate) {
          try {
            await activate(pluginName);
          } catch (e) {
            logger.error(i18n.__('Error on publish/activate'), e);
          }
        }
      }
    };

    const removePlugin = async (needUninstall, needDeactivate) => {
      if (needUninstall) {
        if (needDeactivate) {
          try {
            await deactivate(pluginName);
          } catch (e) {
            logger.error(i18n.__('Error on publish/deactivate'), e);
          }
        }
        try {
          await uninstall(pluginName);
        } catch (e) {
          logger.error(i18n.__('Error on publish/uninstall'), e);
        }
      }
      try {
        await remove(pluginName);
      } catch (e) {
        logger.error(i18n.__('Error on publish/remove'), e);
      }
    };
    if (exist) {
      if (needUpdatePlugin === true) {
        let oldPlugin = await getPlugin(pluginName);
        await removePlugin(oldPlugin, oldPlugin.active);
        await addPlugin(oldPlugin, oldPlugin && oldPlugin.active);
      } else {
        logger.info(i18n.__('Publish plugin'), pluginName, i18n.__('canceled'), i18n.__('local plugin version more actual'));
      }
    } else
      await addPlugin(true, true);
  };

  /**
     * seend via digital asset meessage about plugin was updated for plugin feed
     * @param {string} pluginName name of plugin
     * @param {object} storage storage instance
     * @param {string} operation operation name
     * @param {object} payload payload of operation
     */
  const publishPluginOperation = async (pluginName, storage, operation, payload) => {
    let digitalAssetService = services.get('digitalAsset');
    let operationId = require("crypto").randomBytes(16).readInt16BE();
    let manifest = await storage.getManifest(pluginName);
    let assetBody = {
      type: 'plugin_feed',
      operation: operation,
      pluginName: pluginName,
      producerId: uniqueId,
      operationId
    };
    if (manifest) {
      let manVersion = manifest.version;
      if (manVersion.length > 0 && manVersion[manVersion.length - 1] === '.')
        manVersion = manVersion.slice(0, -1);
      let lv = await storage.version(pluginName);
      let localVersion = manifest.version + lv;
      assetBody.version = localVersion;
    }
    if (payload)
      assetBody.payload = payload;
    if (digitalAssetService) {
      try {
        let tx = await digitalAssetService.createAsset(null, assetBody, '1', {}, false, null, 'plugin_feed', assetFormat, 'Commit');
        logger.debug(i18n.__('pluginFeed added operation updated', pluginName, tx));
      } catch (e) {
        logger.error(e);
      }
    }
  };

  /**
   * publish plugin via digital asset
   * @param {string} pluginName name of plugin
   * @param {string} storage plugin storage name, main if not defined
   */
  const publishPlugin = async (pluginName, storage) => {
    let file = await getStorage(storage).publish(pluginName);
    let digitalAssetService = services.get('digitalAsset');
    if (digitalAssetService) {
      let chunkSize = configService.get('pluginsFeed.publish.chunkSize') || 102400;
      let publishPluginId = require("crypto").randomBytes(16).readInt16BE();
      let chunkCount = Number.parseInt(file.length / chunkSize, 10) + 1;
      try {
        for (var i = 0; i < chunkCount; i++) {
          let buffer = file.slice(i * chunkSize, i * chunkSize + chunkSize);
          let tx = await digitalAssetService.createAsset(null, {
            type: 'plugin_feed',
            operation: 'publish',
            pluginName: pluginName,
            producerId: uniqueId,
            buffer,
            chunkIndex: i,
            chunkCount,
            publishPluginId
          }, '1', {
            publishPluginId
          }, false, null, 'plugin_feed', assetFormat, 'Commit');
          logger.debug(i18n.__('pluginFeed publish created'), pluginName, `${i + 1}/${chunkCount}`, tx);
        }
      } catch (e) {
        logger.error(e);
      }
    }
  };

  /**
   * Choose process by asset
   * @param {object} asset digital asset of plugin feed
   * @param {object} digitalAssetService DA service instance
   * @return {Promise} process function
   */
  const getProceess = (asset, digitalAssetService) => {
    if (asset.operation === MESSAGES.UPDATED && configService.get('pluginsFeed.update.enabled') === true) {
      return processPluginUpdate(asset);
    }
    if (asset.operation === 'publish' && configService.get('pluginsFeed.publish.enabled') === true) {
      return processPluginPublish(asset, digitalAssetService);
    }
    if (asset.operation === MESSAGES.ACTIVATED && configService.get('pluginsFeed.activated.enabled') === true) {
      return processPluginActivate(asset);
    }
    if (asset.operation === MESSAGES.DEACTIVATED && configService.get('pluginsFeed.deactivated.enabled') === true) {
      return processPluginDeactivate(asset);
    }
    if (asset.operation === MESSAGES.INSTALLED && configService.get('pluginsFeed.installed.enabled') === true) {
      return processPluginInstall(asset);
    }
    if (asset.operation === MESSAGES.UNINSTALLED && configService.get('pluginsFeed.uninstalled.enabled') === true) {
      return processPluginUninstall(asset);
    }
    if (asset.operation === MESSAGES.REMOVED && configService.get('pluginsFeed.removed.enabled') === true) {
      return processPluginRemove(asset);
    }
    return;
  };

  /**
   * subscribe via RabbitMQ service to plugins feed
   * @return {Promise} resolve on subscribed
   */
  const subscribe = () => {
    return new Promise((resolve, reject) => {
      let pluginFeedConfig = configService.get('pluginsFeed');
      let digitalAssetService = services.get('digitalAsset');
      if (!pluginFeedConfig || pluginFeedConfig.subscribe !== true)
        return resolve(false);
      let rabbitmqPublisher = services.get('ng-rt-abci-server-rabbitmq-publisherService');
      if (rabbitmqPublisher)
        rabbitmqPublisher.addDeliverTxPublisher(rabbitmqPublisher.types.fanout, 'plugin_feed', 'plugin_feed', false);

      const checkService = () => {
        if (!digitalAssetService) {
          digitalAssetService = services.get('digitalAsset');
        }
        return digitalAssetService;
      };
      const rabbitMQ = services.get('rabbitMQ');
      rabbitMQ.subscribeToFanout("plugin_feed", async message => {
        message = parseMessage(message);
        checkService();
        if (!digitalAssetService || !message || !message.message || !message.message.txId)
          return;
        let asset = await digitalAssetService.getAsset(message.message.txId);
        if (asset && asset.data && asset.data.type === 'plugin_feed' && asset.data.producerId !== uniqueId) {
          try {
            asset = asset.data;
            logger.debug('founded tx', asset);
            await getProceess(asset, digitalAssetService);
          } catch (e) {
            logger.error(e);
          }
        }
      }, () => {
        resolve(true);
      });
    });
  };
  return {
    publishPluginOperation,
    publishPlugin,
    subscribe,
    uniqueId,
    MESSAGES
  };
};
