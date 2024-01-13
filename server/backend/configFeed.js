'use strict';
const logger = require('log4js').getLogger('configFeed');

module.exports = (services, pluginsConfigurationManager) => {
  let uniqueId = require("crypto").randomBytes(16).readInt16BE();
  let i18n = services.get('i18n');
  let rabbitMQ = services.get('rabbitMQ');
  let digitalAssetService = services.get('digitalAsset');
  let configService = services.get('configService');
  logger.info(i18n.__('Start config feed'));
  const assetFormat = {
    sdkVersion: "3.0",
    keyPairType: "Ed25519",
    driverType: "bdbDriver",
    encodeType: "base64"
  };

  const checkService = () => {
    if (!digitalAssetService) {
      digitalAssetService = services.get('digitalAsset');
      return digitalAssetService;
    }
    return digitalAssetService;
  };

  const onAddCallback = async payload => {
    let exclude = configService.get('configFeed.exclude');
    if (exclude && exclude.includes(payload.field))
      return;
    checkService();
    if (!digitalAssetService)
      return;
    const tx = await digitalAssetService.createAsset(null, {
      type: 'config_feed',
      operation: 'add',
      field: payload.field,
      value: payload.value,
      plugin: payload.plugin,
      producerId: uniqueId
    }, '1', {}, false, null, 'config_feed', assetFormat, 'Commit');
    logger.debug(i18n.__('configFeed added operation add', tx));
  };

  const onAddmultipleCallback = async payload => {
    checkService();
    let exclude = configService.get('configFeed.exclude');
    if (exclude && exclude.length > 0) {
      let excluded = false;
      Object.keys(payload.fields).forEach(k => {
        if (exclude.includes(k))
          excluded = true;
      });
      if (excluded)
        return;
    }
    if (!digitalAssetService)
      return;
    const tx = await digitalAssetService.createAsset(null, {
      type: 'config_feed',
      operation: 'addmultiple',
      conf: payload.fields,
      plugin: payload.plugin,
      producerId: uniqueId
    }, '1', {}, false, null, 'config_feed', assetFormat, 'Commit');
    logger.debug(i18n.__('configFeed added operation addmultiple', tx));
  };

  configService.onadd(onAddCallback);
  configService.onaddmultiple(onAddmultipleCallback);
  pluginsConfigurationManager.pluginConfigs.forEach(c => {
    c.config.onadd(onAddCallback);
    c.config.onaddmultiple(onAddmultipleCallback);
  });

  const parseMeessage = message => {
    if (message && typeof message === 'string') {
      try {
        message = JSON.parse(message);
      } catch (err) {
        logger.error(err);
      }
    }
    return message;
  };

  let rabbitmqPublisher = services.get('ng-rt-abci-server-rabbitmq-publisherService');
  if (rabbitmqPublisher)
    rabbitmqPublisher.addDeliverTxPublisher(rabbitmqPublisher.types.fanout, 'config_feed', 'config_feed', false);

  rabbitMQ.subscribeToFanout("config_feed", async message => {
    message = parseMeessage(message);
    checkService();
    if (!digitalAssetService || !message || !message.message)
      return;
    let asset = await digitalAssetService.getAsset(message.message.txId);
    if (asset && asset.data && asset.data.type === 'config_feed' && asset.data.producerId !== uniqueId) {
      try {
        asset = asset.data;
        logger.debug('founded tx', asset);
        switch (asset.operation) {
          case 'add':
            logger.debug(`set config ${asset.field} to ${asset.value}`);
            if (asset.plugin && asset.plugin !== '-') {
              let pluginConfig = pluginsConfigurationManager.get(asset.plugin);
              pluginConfig.set(asset.field, asset.value, true);
            } else
              configService.add(asset.field, asset.value, true);
            break;
          case 'addmultiple':
            logger.debug('set multiple');
            configService.addMultiple(asset.conf, true);
            break;
          default:
        }
      } catch (err) {
        logger.error(err);
      }
    }
  });
};
