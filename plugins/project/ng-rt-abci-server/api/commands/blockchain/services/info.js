'use strict';
const logger = require('log4js').getLogger('commands.blockchain.services.info');
const tmLatestBlockInformationDS = require('../dataService/tmLatestBlockInformationDS');
const tmVersion = require('./tmVersions');

module.exports = async (services, request) => {
  try {
    logger.debug('request : ', request);
    let models = services.get('loopbackApp').models;
    const tmLatestBlockInformation = models.tmLatestBlockInformation;
    let latestBlockInfo = {
      data: 'PROJECT ABCI App',
      version: '0.0.0',
      lastBlockHeight: 0,
      lastBlockAppHash: Buffer.alloc(0)
    };

    const pluginManager = services.get('loopbackApp').plugin_manager;
    const pluginSettings = pluginManager.configs.get('ng-rt-abci-server');
    const tendermintVersions = pluginSettings.get('client').tendermintVersions;
    if (tmVersion.checkTmVersion(request, tendermintVersions)) {
      let latestBlock = await tmLatestBlockInformationDS.findLatestBlock(tmLatestBlockInformation);

      logger.debug(latestBlock);

      if (latestBlock) {
      /* eslint-disable new-cap */
        const appHashBuffer = new Buffer.from(latestBlock.block.appHash, "hex");
        latestBlockInfo.lastBlockHeight = latestBlock.block.height;
        latestBlockInfo.lastBlockAppHash = appHashBuffer;
      }
      return latestBlockInfo;
    }
    logger.info('Your Tendermint version is not compatible');
    return;
  } catch (err) {
    logger.error("Info Error", err.message);
  }
};
