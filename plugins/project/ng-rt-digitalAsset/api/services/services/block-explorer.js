'use strict';

const logger = require('log4js').getLogger('ng-rt-digitalAsset.service.blockExplorer');

/**
 * API/Service/ng-rt-digitalAsset
 *
 * @module API/Service/ng-rt-digitalAsset
 * @type {Object}
 */

module.exports = services => {
  const i18n = services.get('i18n');
  const explorerService = services.get('explorer');

  /**
     * Get block by hash
     * @param  {String} blockHash hash of block to find
     * @param  {boolean} includeTxData true if whole txs needed
     * @return {Promise} the block
   */
  const getBlockbyHash = async (blockHash, includeTxData) => {
    try {
      logger.debug(i18n.__('Get block by hash'));
      const explorerService = services.get('explorer');
      const result = await explorerService.getBlockbyHash(blockHash, includeTxData);
      return result;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

  /**
     * Get block by height
     * @param  {number} blockHeight height of block to find
     * @param  {boolean} includeTxData true if whole txs needed
     * @return {Promise} the block
   */
  const getBlockbyHeight = async (blockHeight, includeTxData) => {
    try {
      logger.debug(i18n.__('Get block by height'));
      const explorerService = services.get('explorer');
      const result = await explorerService.getBlockbyHeight(blockHeight, includeTxData);
      return result;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

  /**
 * Get block between heights
 * @param  {number} height height
 * @param  {string} sortBy ASC or DESC
 * @param  {number} limit number of blocks
 * @param  {number} offset offset
 * @return {Promise} the block
*/
  const getBlockFromHeight = async (height, sortBy, limit, offset) => {
    try {
      logger.debug(i18n.__('Get blocks in certain range of heights'));
      const explorerService = services.get('explorer');
      const result = await explorerService.getBlockFromHeight(height, sortBy, limit, offset);
      return result;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

  /**
    * Get block between heights
    * @param  {number} height height
    * @param  {string} sortBy ASC or DESC
    * @param  {number} limit number of blocks
    * @param  {number} offset offset
    * @return {Promise} the block
  */
  const getBlockToHeight = async (height, sortBy, limit, offset) => {
    try {
      logger.debug(i18n.__('Get blocks in certain range of heights'));
      const explorerService = services.get('explorer');
      const result = await explorerService.getBlockToHeight(height, sortBy, limit, offset);
      return result;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

  /**
     * Get blocks with a limit
     * @param  {number} limit limit for blocks
     * @param  {number} offset paging
     * @param  {string} sortBy sorting
     * @return {Promise} the block
   */
  const getBlocks = async (limit, offset, sortBy) => {
    try {
      logger.debug(i18n.__('Get blocks'));
      const explorerService = services.get('explorer');
      const result = await explorerService.getBlocks(limit, offset, sortBy);
      return result;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

  /**
 * Get block with time
 * @param  {number} time time
 * @param  {string} sortBy ASC or DESC
 * @param  {number} limit number of blocks
 * @param  {number} offset offset
 * @return {Promise} the block
*/
  const getBlockFromTime = async (time, sortBy, limit, offset) => {
    try {
      logger.debug(i18n.__('Get blocks in certain range of time'));
      const explorerService = services.get('explorer');
      const result = await explorerService.getBlockFromTime(time, sortBy, limit, offset);
      return result;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };
  /**
 * Get block with time
 * @param  {number} time time
 * @param  {string} sortBy ASC or DESC
 * @param  {number} limit number of blocks
 * @param  {number} offset offset
 * @return {Promise} the block
*/
  const getBlockToTime = async (time, sortBy, limit, offset) => {
    try {
      logger.debug(i18n.__('Get blocks in certain range of time'));
      const explorerService = services.get('explorer');
      const result = await explorerService.getBlockToTime(time, sortBy, limit, offset);
      return result;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

  /**
     * Get transactions with a limit
     * @param  {number} limit limit for txs
     * @param  {number} offset paging
     * @param  {string} sortBy ASC or DESC
     * @return {Promise} the txs
   */
  const getTransactions = async (limit, offset, sortBy) => {
    try {
      logger.debug(i18n.__('Get transactions'));
      const explorerService = services.get('explorer');
      const result = await explorerService.getTransactions(limit, offset, sortBy);
      return result;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

  /**
     * Get transaction by hash
     * @param  {String} txHash hash of tx to find
     * @return {Promise} the transaction
   */
  const getTxbyHash = async txHash => {
    try {
      logger.debug(i18n.__('Get transaction by hash'));
      const explorerService = services.get('explorer');
      const result = await explorerService.getTxbyHash(txHash);
      return result;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

  /**
     * Get transaction with a time point
     * @param  {string} time time when tx is created
     * @param  {string} sortBy ASC or DESC
     * @param  {number} limit number of txs
     * @param  {number} offset offset
     * @return {Promise} the txs
   */
  const getTxFromTime = async (time, sortBy, limit, offset) => {
    try {
      logger.debug(i18n.__('Get transactions in certain range of time'));
      const explorerService = services.get('explorer');
      const result = await explorerService.getTxFromTime(time, sortBy, limit, offset);
      return result;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };
  /**
 * Get transaction with a time point
 * @param  {number} time time
 * @param  {string} sortBy ASC or DESC
 * @param  {number} limit number of txs
 * @param  {number} offset offset
 * @return {Promise} the txs
*/
  const getTxToTime = async (time, sortBy, limit, offset) => {
    try {
      logger.debug(i18n.__('Get transactions in certain range of time'));
      const explorerService = services.get('explorer');
      const result = await explorerService.getTxToTime(time, sortBy, limit, offset);
      return result;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

  /**
 * Get assets with a limit
 * @param  {number} limit limit for assets
 * @param  {number} offset paging
 * @param  {string} sortBy ASC or DESC
 * @return {Promise} the assets
*/
  const getAssets = async (limit, offset, sortBy) => {
    try {
      logger.debug(i18n.__('Get assets'));
      const explorerService = services.get('explorer');
      const result = await explorerService.getAssets(limit, offset, sortBy);
      return result;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

  /**
 * Get asset by txID
 * @param  {String} txId txId of asset to find
 * @return {Promise} the asset
*/
  const getAssetbytxId = async txId => {
    try {
      logger.debug(i18n.__('Get asset by txId'));
      const explorerService = services.get('explorer');
      const result = await explorerService.getAssetbytxId(txId);
      return result;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };
  /**
       * Get asssets with a time point
       * @param  {string} time time when tx is created
       * @param  {string} sortBy ASC or DESC
       * @param  {number} limit number of assets
       * @param  {number} offset offset
       * @return {Promise} the assets
     */
  const getAssetFromTime = async (time, sortBy, limit, offset) => {
    try {
      logger.debug(i18n.__('Get assets in certain range of time'));
      const explorerService = services.get('explorer');
      const result = await explorerService.getAssetFromTime(time, sortBy, limit, offset);
      return result;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };
  /**
 * Get assets with a time point
 * @param  {number} time time
 * @param  {string} sortBy ASC or DESC
 * @param  {number} limit number of assets
 * @param  {number} offset offset
 * @return {Promise} the assets
*/
  const getAssetToTime = async (time, sortBy, limit, offset) => {
    try {
      logger.debug(i18n.__('Get assets in certain range of time'));
      const explorerService = services.get('explorer');
      const result = await explorerService.getAssetToTime(time, sortBy, limit, offset);
      return result;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

/**
 * Get total number of txs
 * @return {Object} number of txs
*/
  const getNumberOfTxs = async () => {
    try {
      logger.debug(i18n.__('Get number of txs'));
      const explorerService = services.get('explorer');
      const result = await explorerService.getNumberOfTxs();
      return result;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

/**
 * Get total number of blocks
 * @return {Object} number of blocks
*/
  const getNumberOfBlocks = async () => {
    try {
      logger.debug(i18n.__('Get number of blocks'));
      const explorerService = services.get('explorer');
      const result = await explorerService.getNumberOfBlocks();
      return result;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };

  /**
   * The complete NodeInfo
   * @typedef {Object} NodeInfo
   * @property {string} network - ChainId of the blokchain network.
   * @property {string} version - Tendermint version.
   * @property {string} moniker - Name of Node.
   * @property {string} remoteIp - Remote Ip of the node.
   * @property {string} id - Node id of the node.
   */
  
  /**
   * Get list of nodes
   * @return {Array<NodeInfo>} Node info 
   * [{
   *  id: string,
   *  network: string,
   *  version: string,
   *  moniker: string,
   *  remoteIp: string
   * }]
  */
  const getListOfNodes = async () => {
    try {
      logger.debug(i18n.__('Get a list of nodes'));
      const configService = services.get('configService');
      const protocol = configService.get('https') === false ? 'http' : 'https';
      const serverUrl = `${protocol}://${configService.get('tendermintHost')}:${configService.get('tendermintPort')}`;
      const peerInfoUrl=`${serverUrl}/net_info`; // returns a list of peers if any. https://docs.tendermint.com/master/rpc/#/Info
      const peerInfo = await explorerService.getBlockchainInfo(peerInfoUrl);
      let nodes=[];
      if(peerInfo.hasOwnProperty('result') && peerInfo.result.hasOwnProperty('peers')){
        nodes=peerInfo.result.peers.map(function(peer){
          return {
            id: peer.node_info.id,
            network: peer.node_info.network,
            moniker: peer.node_info.moniker,
            version: peer.node_info.version,
            remoteIp: peer.remote_ip
          }
        });
      }
      const blockchainInfoUrl = `${serverUrl}/status`;
      const blockchainInfo = await explorerService.getBlockchainInfo(blockchainInfoUrl);
      if(blockchainInfo.hasOwnProperty('result') && blockchainInfo.result.hasOwnProperty('node_info')){
        nodes.push({
          id: blockchainInfo.result.node_info.id,
          network: blockchainInfo.result.node_info.network,
          moniker: blockchainInfo.result.node_info.moniker,
          version: blockchainInfo.result.node_info.version,
          remoteIp: ''
        })
      }
      return nodes;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  };
  return {
    getBlockbyHash,
    getBlockbyHeight,
    getBlockFromHeight,
    getBlockToHeight,
    getBlocks,
    getBlockFromTime,
    getBlockToTime,
    getTransactions,
    getTxbyHash,
    getTxFromTime,
    getTxToTime,
    getAssets,
    getAssetbytxId,
    getAssetFromTime,
    getAssetToTime,
    getNumberOfTxs,
    getNumberOfBlocks,
    getListOfNodes
  };
};
