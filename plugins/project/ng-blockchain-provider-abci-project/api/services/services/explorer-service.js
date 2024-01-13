'use strict'

const logger = require('log4js').getLogger(
  'ng-blockchain-provider-abci-project.api.services.services.explorer-service'
)
const mergeByKey = require('array-merge-by-key')
const request = require('request-promise')
let models = {}
let i18n = {}
/*eslint-disable*/

const checkNumber = (value) => {
  return (
    (typeof value === "number" ||
      Object.prototype.toString.call(value) === "[object Number]") &&
    value.valueOf() === value.valueOf()
  );
};

const validateTimestamp = (time) => {
  var regexExp = /^\d{10}$|^\d{13}$/;
  return checkNumber(time) && regexExp.test(time.toString());
};
/**
 * validate time in standard format
 * @param {string} time the time of block
 * @return {string} time in standard format
 */
const timeValidation = async (time) => {
  let isValid;
  if (isNaN(time)) {
    isValid = Date.parse(time) / 1000;
  } else {
    isValid = parseInt(time);
  }
  const checkTimestamp = validateTimestamp(isValid);
  if (checkTimestamp === true) {
    return isValid;
  } else {
    throw new Error("time is invalid");
  }
};

/**
 * Await an array of promises and return the result
 * @param {Array} txArray Array of transactions
 */
const asyncPromise = async (txArray)=>{
  let txHash=[];
  const transactions = await Promise.all(
    txArray.map(async (tx) => {
      const txJson = tx.toJSON();
      txHash.push(txJson.txId);
      const structuredTx = await txStructure(txJson);
      return structuredTx;
    })).catch((error) => {
    throw error;
  });
  return [transactions, txHash];
}
/**
 *  Should return a mapping of ownerpubkey and amount for given txId {owner,amount}
 *
 */
const resolvedInputs = async (inputs, txId, operation) => {
  try {
    let prevOwnerDetails = [];
    let totalAmount = 0;
    for (let index = 0; index < inputs.length; index++) {
      let data = {};
      let txOutput = [];
      const element = inputs[index];
      switch (operation) {
        case "CREATE":
          txOutput = await models.txOutput.find({
            where: { txId: txId[index] },
          });
          data = {
            owner: element.owners_before[0],
            amount: txOutput.reduce((sum, output) => {
              return sum + Number(output.amount);
            }, 0),
          };
          break;
        case "TRANSFER":
          txOutput = await models.txOutput.find({
            where: {
              txId: txId[index],
              outputIndex: element.fulfills.output_index,
            },
          });
          data = {
            owner: element.owners_before[0],
            amount: Number(txOutput[0].amount),
          };
          break;
        default:
          throw Error(`Operation: ${operation} not suppported`);
      }

      if (txOutput.length === 0) {
        throw new Error("TxOutput not found for TransactionId" + txId[index]);
      }
      prevOwnerDetails.push(data);
      totalAmount += data.amount;
    }
    return { inputs: prevOwnerDetails, amount: totalAmount };
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

const resolvedOutputs = (outputs) => {
  const output = [];
  for (let i = 0; i < outputs.length; i++) {
    let data = {
      owner: outputs[i].public_keys[0],
      amount: outputs[i].amount,
    };
    output.push(data);
  }
  return output;
};
/**
 * block structure
 * @param {object} result block
 * @return {object} block in a standard structure
 */
const blockStructure = (result) => {
  let block = {};
  block.blockHash = result.hash;
  block.blockHeight = result.block.height.low;
  block.blockTime = result.block.time.low;
  block.transactionNo = result.block.numTxs.low;
  block.transactionHashes = result.transactions;
  block.appHash = result.block.appHash;
  block.blockProposerNodeId = result.block.proposerAddress;
  return block;
};

/**
 * transaction structure
 * @param {object} result transaction
 * @return {object} transaction in a standard structure
 */
const txStructure = async (result) => {
  try {
    let tx = {};
    tx.transferSourceTxId = [];
    if (result.txData.operation === "CREATE") {
      tx.assetId = result.txId;
      tx.transferSourceTxId.push(result.txId);
    } else if (result.txData.operation === "TRANSFER") {
      tx.assetId = result.txData.asset.id;
      for (let index = 0; index < result.txData.inputs.length; index++) {
        tx.transferSourceTxId.push(
          result.txData.inputs[index].fulfills.transaction_id
        );
      }
    }
    tx.txId = result.txId;
    tx.txType = result.txData.operation;
    tx.txTime = result.txMetadata.project.timestamp;
    tx.owners = resolvedOutputs(result.txData.outputs);
    let data = await resolvedInputs(
      result.txData.inputs,
      tx.transferSourceTxId,
      result.txData.operation
    );
    tx.previousOwnerPublicKey = data.inputs;
    tx.amount = data.amount;
    // extract type and hash from tmAsset model relation
    tx.assetType = result.asset.type;
    tx.assetHash = result.asset.hash;
    return tx;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * asset structure
 * @param {object} result asset
 * @return {object} asset in a standard structure
 */
const assetStructure = (result) => {
  let asset = {};
  asset.assetId = result.txId;
  asset.assetType = result.type;
  asset.assetHash = result.hash;
  asset.data = result.data;
  asset.divisiblity = "No";
  return asset;
};

const filterTxsInBlock = async (txHashes) => {
  const { tmTx } = models;
  let _txFilter = { where: { txId: { inq: txHashes } } };
  const txs = await tmTx.find(_txFilter);
  return txs;
};

/**
 * Reads block by blockhash
 * @param {string} blockHash the hash of block
 * @param {boolean} includeTxData true or false if whole transaction needed
 * @return {object} the block object or null if the block can't be found
 */
const getBlockbyHash = async (blockHash, includeTxData) => {
  try {
    logger.debug(i18n.__("Get block"));
    logger.debug(i18n.__("blockHash"), blockHash);

    if (typeof blockHash == "string" && blockHash.length > 0) {
      let result = await models.tmBlock.findOne({ where: { hash: blockHash } });
      let block = blockStructure(result);
      if (includeTxData === true) {
        let txData = await filterTxsInBlock(block.transactionHashes);
        block.transactionHashes = txData;
      }
      return block;
    } else {
      throw Error("Invalid block hash");
    }
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Reads block by height
 * @param {number} blockHeight the height of block
 * @param {boolean} includeTxData true or false if whole transaction needed
 * @return {object} the block object or null if the block can't be found
 */
const getBlockbyHeight = async (blockHeight, includeTxData) => {
  try {
    logger.debug(i18n.__("Get block by Height"));
    const filter = { where: { "block.height.low": blockHeight } };
    let result = await models.tmBlock.findOne(filter);
    let block = blockStructure(result);
    if (includeTxData === true) {
      let txData = await filterTxsInBlock(block.transactionHashes);
      block.transactionHashes = txData;
    }
    return block;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Reads block from height
 * @param {number} height the height of block
 * @param {string} sortBy sort ASC or DESC
 * @param {number} limit number of blocks needed as a result
 * @param {number} offset offset for pagination
 * @return {array} the array of blocks object or null array if the block can't be found
 */
const getBlockFromHeight = async (height, sortBy = "ASC", limit, offset) => {
  try {
    let blocks = [];
    let result;
    logger.debug(i18n.__("Get blocks from height"));

    result = await models.tmBlock.find({
      where: { blockHeight: { gte: height } },
      order: `createdOn ${sortBy}`,
      skip: offset,
    });

    result.forEach((tx) => {
      let block = blockStructure(tx);
      blocks.push(block);
    });
    blocks = blocks.slice(0, limit);
    return blocks;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Reads block to height
 * @param {number} height the height of block
 * @param {string} sortBy sort ASC or DESC
 * @param {number} limit number of blocks needed as a result
 * @param {number} offset offset for pagination
 * @return {array} the array of blocks object or null array if the block can't be found
 */
const getBlockToHeight = async (height, sortBy = "ASC", limit, offset) => {
  try {
    logger.debug(i18n.__("Get block to Height"));
    let result = await models.tmBlock.find({
      where: { blockHeight: { lte: height } },
      order: `createdOn ${sortBy}`,
      skip: offset,
    });

    let blocks = result.map(blockStructure);

    blocks = blocks.slice(0, limit);
    return blocks;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Reads all blocks
 * @param {string} limit sort ASC or DESC
 * @param {number} offset number of blocks needed as a result
 * @param {number} sprtBy offset for pagination
 * @return {array} the array of blocks object or null array if the block can't be found
 */
const getBlocks = async (limit, offset, sortBy) => {
  try {
    let blocks = [];
    logger.debug(i18n.__("Get blocks"));
    let result = await models.tmBlock.find({
      limit: limit,
      order: `createdOn ${sortBy}`,
      skip: offset,
    });
    result.forEach((tx) => {
      let block = blockStructure(tx);
      blocks.push(block);
    });

    return blocks;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Reads block from time
 * @param {string} time the time of block
 * @param {string} sortBy sort ASC or DESC
 * @param {number} limit number of blocks needed as a result
 * @param {number} offset offset for pagination
 * @return {array} the array of blocks object or null array if the block can't be found
 */
const getBlockFromTime = async (time, sortBy = 'ASC', limit, offset) => {
  try {
    let blocks = [];
    let block;
    let result;
    logger.debug(i18n.__("Get blocks"));
    //check if given string is valid number(time in millisecond)
    time = await timeValidation(time);
    result = await models.tmBlock.find({
      where: { blockTime: { gte: time } },
      order: `createdOn ${sortBy}`,
      skip: offset,
    });
    result.forEach((tx) => {
      block = blockStructure(tx);
      blocks.push(block);
    });
    blocks = blocks.slice(0, limit);
    return blocks;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Reads block to time
 * @param {string} time the time of block
 * @param {string} sortBy sort ASC or DESC
 * @param {number} limit number of blocks needed as a result
 * @param {number} offset offset for pagination
 * @return {array} the array of blocks object or null array if the block can't be found
 */
const getBlockToTime = async (time, sortBy, limit, offset) => {
  try {
    let blocks = [];
    let block;
    let result;
    logger.debug(i18n.__("Get blocks"));
    //check if given string is valid number(time in millisecond)
    time = await timeValidation(time);

    result = await models.tmBlock.find({
      where: { blockTime: { lte: time } },
      order: `createdOn ${sortBy}`,
      skip: offset,
    });

    result.forEach((tx) => {
      block = blockStructure(tx);
      blocks.push(block);
    });
    blocks = blocks.slice(0, limit);
    return blocks;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

const filterAssets = async (txIds) => {
  const { tmAsset } = models;
  let _assetFilter = { where: { txId: { inq: txIds } } };
  const fetchedTxs = await tmAsset.find(_assetFilter);
  const assets = fetchedTxs.map((tx) => {
    return {
      txId: tx.txId,
      assetType: tx.type,
      assetHash: tx.hash,
    };
  });
  return assets;
};

const filterBlock = async (txIds) => {
  const { tmBlock } = models;
  const assets = [];
  let data;
  const fetchedTxs = await tmBlock.find();
  for (let i = 0; i < fetchedTxs.length; i++) {
    let txs = fetchedTxs[i].transactions;
    txs.forEach((tx) => {
      if (txIds.includes(tx)) {
        data = {
          txId: tx,
          blockHash: fetchedTxs[i].hash,
        };
        assets.push(data);
      }
    });
  }
  return assets;
};

/**
 * Reads all txs
 * @param {string} limit sort ASC or DESC
 * @param {number} offset number of txs needed as a result
 * @param {number} sprtBy offset for pagination
 * @return {array} the array of txs object or null array if the tx can't be found
 */
const getTransactions = async (limit, offset, sortBy) => {
  try {
    logger.debug(i18n.__("getTransactions method"));
    let result = await models.tmTx.find({
      limit: limit,
      order: `createdOn ${sortBy}`,
      skip: offset,
      include:{relation:'asset', scope:{fields: ['type','hash']}}
    });
    
    const [txs, txHash] = await asyncPromise(result);
    // retrieve asset hash and asset type from tmAsset
    const blockInfo = await filterBlock(txHash); 

    // merge 2 arrays on basic of transaction id
    let finalTxs = mergeByKey("txId", txs, blockInfo);
    return finalTxs;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Reads block by blockhash
 * @param {string} blockHash the hash of block
 * @return {object} the asset object or null if the asset can't be found
 */
const getTxbyHash = async (hash) => {
  try {
    logger.debug(i18n.__("Get Tx"));
    logger.debug(i18n.__("hash"), hash);

    if (typeof hash == "string" && hash.length > 0) {
      let result = await models.tmTx.findOne({ where: { txId: hash } });
      let assetInfo = await models.tmAsset.findOne({ where: { txId: hash } });
      let blockHash;
      const blockInfo = await models.tmBlock.find();
      for (let i = 0; i < blockInfo.length; i++) {
        let transaction = blockInfo[i].transactions;
        if (transaction.includes(hash)) {
          blockHash = blockInfo[i].hash;
        }
      }
      let tx = await txStructure(result);
      tx.assetType = assetInfo.type;
      tx.assetHash = assetInfo.hash;
      tx.blockHash = blockHash;
      return tx;
    } else {
      throw Error("Invalid tx hash");
    }
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Reads txs from time
 * @param {string} time the time of tx
 * @param {string} sortBy sort ASC or DESC
 * @param {number} limit number of txs needed as a result
 * @param {number} offset offset for pagination
 * @return {array} the array of txs object or null array if the tx can't be found
 */
const getTxFromTime = async (time, sortBy, limit, offset) => {
  try {
    logger.debug(i18n.__("Get Tx from time"));
    //check if given string is valid number(time in millisecond)
    time = await timeValidation(time);
    const result = await models.tmTx.find({
      where: { txTime: { gte: time } },
      order: `createdOn ${sortBy}`,
      skip: offset,
      include:{relation:'asset', scope: {fields: ['type','hash']}}
    });

    const [txs, txHash] = await asyncPromise(result)
    const blockInfo = await filterBlock(txHash);

    // merge 2 arrays on basic of transaction id
    let finalTxs = mergeByKey("txId", txs, blockInfo);
    finalTxs = finalTxs.slice(0, limit);
    return finalTxs;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};
/**
 * Reads txs to time
 * @param {string} time the time of tx
 * @param {string} sortBy sort ASC or DESC
 * @param {number} limit number of txs needed as a result
 * @param {number} offset offset for pagination
 * @return {array} the array of txs object or null array if the tx can't be found
 */
const getTxToTime = async (time, sortBy, limit, offset) => {
  try {
    logger.debug(i18n.__("Get txs"));
    //check if given string is valid number(time in millisecond)
    time = await timeValidation(time);
    const result = await models.tmTx.find({
      where: { txTime: { lte: time } },
      order: `createdOn ${sortBy}`,
      skip: offset,
      include:{relation:'asset', scope: { fields: ['type','hash']}}
    });

    const [txs, txHash] = await asyncPromise(result);
    const blockInfo = await filterBlock(txHash);
    
    // merge 2 arrays on basic of transaction id
    let finalTxs = mergeByKey("txId", txs, blockInfo);
    finalTxs = finalTxs.slice(0, limit);
    return finalTxs;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

// asset section is under implementation
const filtertxs = async (txIds) => {
  const { tmTx } = models;
  const assets = [];
  let _txFilter = {where:{txId:{inq:txIds}}}
  const fetchedTxs = await tmTx.find(_txFilter);
  fetchedTxs.forEach((tx) => {
      let data={};
      if (tx.txData.operation === "CREATE") {
        data = {
          assetId: tx.txId,
          amount: tx.txData.outputs[0].amount,
          metadata: tx.txData.metadata,
          assetTime: tx.txMetadata.project.timestamp,
          currentOwnerPublicKey: tx.txData.outputs[0].public_keys[0],
          previousOwnerPublicKey: tx.txData.inputs[0].owners_before[0],
          transferSourceTxId: tx.txId,
        };
      } else if (tx.txData.operation === "TRANSFER") {
        data = {
          assetId: tx.txId,
          amount: tx.txData.outputs[0].amount,
          metadata: tx.txData.metadata,
          assetTime: tx.txMetadata.project.timestamp,
          currentOwnerPublicKey: tx.txData.outputs[0].public_keys[0],
          previousOwnerPublicKey: tx.txData.inputs[0].owners_before[0],
          transferSourceTxId: tx.txData.inputs[0].fulfills.transaction_id,
        };
      }
      assets.push(data);
  });
  return assets;
};

/**
 * OPeration TRANSFER: 
 * @param {*} assets 
 */
const filterData = async (assets) => {
  const { tmAsset } = models;
  for (let i = 0; i < assets.length; i++) {
    if (assets[i].data.id) {
      const data = await tmAsset.findOne({
        where: { txId: assets[i].data.id },
      });
      assets[i].data = data.data;
      assets[i].assetHash = data.hash;
    } else {
      assets[i].data = assets[i].data;
    }
  }
  return assets;
};

/**
 * Reads all assets
 * @param {string} limit sort ASC or DESC
 * @param {number} offset number of assets needed as a result
 * @param {number} sprtBy offset for pagination
 * @return {array} the array of assets object or null array if the asset can't be found
 */
const getAssets = async (limit, offset, sortBy) => {
  try {
    let assets = [];
    let assetIds = [];
    logger.debug(i18n.__("Get assets"));
    let result = await models.tmAsset.find({
      limit: limit,
      order: `createdOn ${sortBy}`,
      skip: offset,
    });

    result.forEach((asset) => {
      let data = assetStructure(asset);
      assets.push(data);
      assetIds.push(data.assetId);
    });
    const assetData = await filterData(assets);
    const txInfo = await filtertxs(assetIds);
    let finalAssets = mergeByKey("assetId", assetData, txInfo);
    return finalAssets;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Reads asset by txid
 * @param {string} txId the txId from which asset is created
 * @return {object} the asset object or null if the asset can't be found
 */
const getAssetbytxId = async (txId) => {
  try {
    logger.debug(i18n.__("Get asset"));
    logger.debug(i18n.__("txId"), txId);

    if (typeof txId == "string" && txId.length > 0) {
      let result = await models.tmAsset.findOne({ where: { txId: txId } });
      let txInfo = await models.tmTx.findOne({ where: { txId: txId } });
      let asset = assetStructure(result);
      if (asset.data.id) {
        const data = await models.tmAsset.findOne({
          where: { txId: asset.data.id },
        });
        asset.data = data.data;
      } else {
        asset.data = asset.data;
      }
      asset.assetId = txInfo.txId;
      asset.amount = txInfo.txData.outputs[0].amount;
      asset.metadata = txInfo.txData.metadata;
      asset.assetTime = txInfo.txMetadata.project.timestamp;
      asset.currentOwnerPublicKey = txInfo.txData.outputs[0].public_keys[0];
      asset.previousOwnerPublicKey = txInfo.txData.inputs[0].owners_before[0];
      if (txInfo.txData.operation === "TRANSFER") {
        asset.transferSourceTxId =
          txInfo.txData.inputs[0].fulfills.transaction_id;
      } else if (txInfo.txData.operation === "CREATE") {
        asset.transferSourceTxId = txInfo.txId;
      }
      return asset;
    } else {
      throw Error("Invalid txId");
    }
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Reads assets from time
 * @param {string} time the time of asset
 * @param {string} sortBy sort ASC or DESC
 * @param {number} limit number of assets needed as a result
 * @param {number} offset offset for pagination
 * @return {array} the array of assets object or null array if the asset can't be found
 */
const getAssetFromTime = async (time, sortBy = "ASC", limit, offset) => {
  try {
    let assets = [];
    let assetHash = [];
    let assetIds = [];
    let result;
    logger.debug(i18n.__("Get txs"));

    //check if given string is valid number(time in millisecond)
    time = await timeValidation(time);

    result = await models.tmMetadata.find({
      where: { txTime: { gte: time } },
      order: `createdOn ${sortBy}`,
      skip: offset,
    });
    result.forEach((tx) => {
      assetHash.push(tx.txId);
    });
    // retrieve all assets in order(ASC or DESC)
    let _assetFilter = {where:{txId:{inq:assetHash}}}
    let allAssets = await models.tmAsset.find(_assetFilter);
    allAssets.forEach((asset) => {
        let data = assetStructure(asset);
        assets.push(data);
        assetIds.push(data.assetId);
    });

    // retrieve asset data if tx type is transfer
    let assetData = await filterData(assets);
    const txInfo = await filtertxs(assetIds);
    if (sortBy === "DESC") {
      assetData = assetData.reverse();
    }
    let finalAssets = mergeByKey("assetId", assetData, txInfo);
    finalAssets = finalAssets.slice(0, limit);
    return finalAssets;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Reads asset to time
 * @param {string} time the time of asset
 * @param {string} sortBy sort ASC or DESC
 * @param {number} limit number of assets needed as a result
 * @param {number} offset offset for pagination
 * @return {array} the array of assets object or null array if the asset can't be found
 */
const getAssetToTime = async (time, sortBy = 'ASC', limit, offset) => {
  try {
    let assets = [];
    let assetHash = [];
    let assetIds = [];
    let result;
    logger.debug(i18n.__("Get txs"));

    //check if given string is valid number(time in millisecond)
    time = await timeValidation(time);

      result = await models.tmMetadata.find({
        where: { txTime: { lte: time } },
        order: `createdOn ${sortBy}`,
        skip: offset,
      });

    //fetch all txids using metadata timestamp
    result.forEach((tx) => {
      assetHash.push(tx.txId);
    });
    // retrieve all assets in order(ASC or DESC)
    let _assetFilter = {where:{txId:{inq:assetHash}}}
    let allAssets = await models.tmAsset.find(_assetFilter);
    allAssets.forEach((asset) => {
      let data = assetStructure(asset);
      assets.push(data);
      assetIds.push(data.assetId);
    });

    // retrieve asset data if tx type is transfer
    let assetData = await filterData(assets);
    const txInfo = await filtertxs(assetIds);
    if (sortBy === "DESC") {
      assetData = assetData.reverse();
    }
    let finalAssets = mergeByKey("assetId", assetData, txInfo);
    finalAssets = finalAssets.slice(0, limit);
    return finalAssets;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Get total number of txs
 * @return {Object} number of txs
 */
const getNumberOfTxs = async () => {
  try {
    logger.debug(i18n.__("Get number of txs"));
    let txs = await models.tmTx.count();
    return { txs };
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Get total number of blocks
 * @return {Object} number of blocks
 */
const getNumberOfBlocks = async () => {
  try {
    logger.debug(i18n.__("Get number of blocks"));
    let blocks = await models.tmBlock.count();
    return { blocks };
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Get blockchain Info
 * @param {string} rpcUrl Url of the rpc method
 * @return {Object} info of the blockchain for given rpcMethod
 */
const getBlockchainInfo = async(rpcUrl) => {
  const headers = {
    'Accept': 'application/json'
  };

  const options = {
    url: rpcUrl,
    method: 'GET',
    headers: headers,
    json: true
  };

  return request(options).then(response => {
    if (response.error) {
      // In case the Tendermint server has an internal error (e.g. when forwarding the tx to the abci-server)
      // we will get a valid response with the Tendermit error message contained as an 'error' object
      // Thus we need to interpret this as an error here
      logger.error(response.error);
      return Promise.reject(response.error);
    }
    return Promise.resolve(response);
  }).catch(error => {
    logger.error(error);
    return Promise.reject(error);
  });
};
/**
 * API/Service/ng-rt-digitalAsset
 *
 * @module API/Service/ng-rt-digitalAsset
 * @type {Object}
 */

module.exports = (services) => {
  i18n = services.get("i18n");
  models = services.get("loopbackApp").models;

  return {
    getBlockbyHash,
    getBlockbyHeight,
    resolvedInputs,
    resolvedOutputs,
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
    txStructure,
    assetStructure,
    blockStructure,
    timeValidation,
    getNumberOfTxs,
    getNumberOfBlocks,
    getBlockchainInfo
  };
};
