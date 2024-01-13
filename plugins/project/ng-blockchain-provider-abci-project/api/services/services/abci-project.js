'use strict';

const logger = require('log4js').getLogger('ng-rt-digitalAsset.service.tendermint');
const request = require('request-promise');
const {Base64} = require('js-base64');
const crypto = require("crypto");

let models = {};
let i18n = {};
let metricsClient = {};
/**
 * Resolve transaction type
 * @param {string} method TM route methods used to send Tx
 * @return {string}  type of transaction
 */
const resolveTendermintTxType = method => {
  switch (method) {
    case 'Async':
      return "broadcast_tx_async";
    case 'Sync':
      return "broadcast_tx_sync";
    case 'Commit':
      return "broadcast_tx_commit";
    default:
      return "broadcast_tx_async";
  }
};

/**
 * Filters a list of given transactions by a asset type
 * @param {Array} transactions list of transactions to filter
 * @param {string} assetType the asset type
 * @return {Array} filtered transactions
 */
const filterTransactionsByAssetType = async(transactions, assetType) => {
  const {tmAsset} = models;
  // const assetsCache = new Map();

  // for (let tx of transactions) {
  //   let asset;
  //   let assetId;
  //   if (tx.txData.operation === 'CREATE') {
  //     assetId = tx.txId;
  //   } else if (tx.txData.operation === 'TRANSFER') {
  //     assetId = tx.txData.asset.id;
  //   }
  //   asset = assetsCache.get(assetId);
  //   if (!asset) {
  //     const filter = { where: { txId: assetId } };
  //     asset = await tmAsset.findOne(filter);
  //     assetsCache.set(assetId, asset);
  //   }
  //   if (asset && asset.type === assetType) {
  //     filteredTxs.push(tx);
  //   }
  // }
  const filteredTxs = await tmAsset.find({
    where: {
      type: assetType,
      txId: {inq: transactions}
    }
  });
  return filteredTxs;
};

/**
 * Get all transactions with the public key in the transaction output (output.public_keys)
 * @param  {string} publicKey Public key
 * @param  {string} assetType Type of asset
 * @return {Array} list of all transactions with the public key in the output
 */
const getOutputs = async(publicKey, assetType) => {
  try {
    const {txOutput} = models;
    const fetchedOutputs = await txOutput.find({
      where: {
        public_key: publicKey
      },
      include: {
        relation: 'tx',
        scope: {
          include: 'asset'
        }
      }
    });
    const fetchedAssets = await filterTransactionsByAssetType(fetchedOutputs.map(o => o.txId), assetType);
    return fetchedOutputs.filter(o => fetchedAssets.map(a => a.txId).includes(o.txId));
  } catch (err) {
    logger.error(err.message);
  }
};

/**
 * Gets all transactions with the public key in the transaction input (input.owners_before)
 * @param  {string} publicKey Public key
 * @param  {string} assetType Type of asset
 * @return {Array} list of transactions
 */
const getInputs = async(publicKey, assetType) => {
  try {
    const {txInput} = models;
    const fetchedInputs = await txInput.find({
      where: {
        owners_before: publicKey,
        operation: "TRANSFER"
      },
      include: {
        relation: 'tx',
        scope: {
          include: 'asset'
        }
      }
    });
    const fetchedAssets = await filterTransactionsByAssetType(fetchedInputs.map(i => i.txId), assetType);
    return fetchedInputs.filter(i => fetchedAssets.map(a => a.txId).includes(i.txId));
  } catch (error) {
    logger.error(error);
  }
};

/**
 * Gets all transactions with the public key in the transaction input (input.owners_before) and
 * with the public key in the transaction output (output.public_keys)
 * @param  {string} publicKey Public key
 * @param  {string} assetType Type of asset
 * @return {object} list of transactions separated by inputs and outputs
 */
const getInputsAndOutputs = async(publicKey, assetType) => {
  try {
    const inputTxs = await getInputs(publicKey, assetType);
    const outputTxs = await getOutputs(publicKey, assetType);

    return {
      inputs: inputTxs,
      outputs: outputTxs
    };
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * Gets all unspent transactions for the public key
 * @param  {string} publicKey Public key
 * @param  {string} assetType Type of asset
 * @return {Array} list of unspent transactions
 */
const getUnspentOutputs = async(publicKey, assetType) => {
  try {
    const inputsAndOutputs = await getInputsAndOutputs(publicKey, assetType);
    const outputs = inputsAndOutputs.outputs;
    const inputs = inputsAndOutputs.inputs;
    const unspentOutputs = new Map();

    await Promise.all(outputs.map(async o => {
      unspentOutputs.set(o.txId, o);
      return Promise.resolve();
    }));

    inputs.forEach(i => {
      const txId = i.fulfills.transaction_id;
      unspentOutputs.delete(txId);
    });
    return Array.from(unspentOutputs.values());
  } catch (error) {
    logger.error(error);
  }
};

/**
 * Posts a transaction to Tendermint
 * @param {*} txData Transaction Data
 * @param {object} projectMetadata project metadata
 * @param {object} assetDescriptor asset decription
 * @param {string} method transaction method ('Async' | 'Sync' | 'Commit')
 * @param {string} serverURL Tendermint server URL
 * @return {Promise} json response from TM
 */
const postTx = async(txData, projectMetadata, assetDescriptor, method = 'Async', serverURL) => {
  const headers = {
    'Content-Type': 'text/plain',
    'Accept': 'application/json-rpc'
  };
  let assetHash;

  if (assetDescriptor.isFungible == false) {
    let data = JSON.stringify(txData.asset);
    assetHash = crypto.createHash('sha256').update(data, 'utf-8').digest('hex');
    assetDescriptor.assetHash = assetHash;
  }

  const composedTx = {
    tx: txData,
    assetDescriptor: assetDescriptor,
    projectMetadata: projectMetadata
  };
  const txDataStringified = JSON.stringify(composedTx);
  const txDataEncoded = Base64.encode(txDataStringified);

  const txMethod = resolveTendermintTxType(method);
  const options = {
    url: serverURL,
    method: 'POST',
    headers: headers,
    json: true,
    body: {jsonrpc: "2.0", method: txMethod, params: {tx: txDataEncoded}}
  };
  metricsClient.increment(`PostTx, TxMethod=${txMethod}`);

  return request(options).then(response => {
    if (response.error) {
      // In case the Tendermint server has an internal error (e.g. when forwarding the tx to the abci-server)
      // we will get a valid response with the Tendermit error message contained as an 'error' object
      // Thus we need to interpret this as an error here
      logger.error(response.error);
      return Promise.reject(response.error);
    }
    if (response.result && response.result.hash) {
      response.result.hash = txData.id; // actually the hash being returned here should be the hash returned by tendermint,
      // however this would lead to a different hash than the hash created by the bigchaindb driver.
      // For now we decided to use the bigchain driver hash to ignore hashes mismatching.
    }
    return Promise.resolve(response);
  }).catch(error => {
    logger.error(error);
    return Promise.reject(error);
  });
};
/**
 * Reads tx by Id
 * @param {string} id the asset id (asset id is equal to the txId of the corresponding CREATE transaction)
 * @return {object} the asset object or null if the asset can't be found
 */
const getTxById = async id => {
  try {
    logger.debug(i18n.__('Get Tx by Id'));
    logger.debug(i18n.__('Id'), id);

    // check if id is 'null','undefined' or 'numbers' then throw error
    if (typeof (id) == "string" && id.length > 0) {
      let result = await models.tmTx.findOne({where: {txId: id}});
      return result;
    }
    throw Error("Invalid transaction Id");
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Reads asset by Id
 * @param {string} id the asset id (asset id is equal to the txId of the corresponding CREATE transaction)
 * @return {object} the asset object or null if the asset can't be found
 */
const getAssetById = async id => {
  try {
    logger.debug(i18n.__('Get Tx by Id'));
    logger.debug(i18n.__('Id'), id);

    // check if id is 'null','undefined' or 'numbers' then throw error
    if (typeof (id) == "string" && id.length > 0) {
      let result = await models.tmAsset.findOne({where: {txId: id}});
      return result;
    }
    throw Error("Invalid transaction Id");
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Gets the balance for an account represented by a public key
 * @param {string} publicKey Public key of the user
 * @param {string} assetType Type of Digital Asset
 * @return {Number} balance The balance for the given Public Key and Asset Type
 */
const getBalance = async(publicKey, assetType) => {
  try {
    logger.debug(i18n.__('Get balance'));
    logger.debug(i18n.__('Public key'), publicKey);
    logger.debug(i18n.__('Type of asset'), assetType);
    const unspentOutputTxs = await getUnspentOutputs(publicKey, assetType);
    const balance = unspentOutputTxs.reduce((sum, output) => {
      return sum + Number(output.amount); // extracting the first element but it should handle multiple indexes
    }, 0);
    logger.debug(i18n.__(`Balance for public key %s is %s %s`, publicKey, balance, assetType));
    return balance;
  } catch (err) {
    logger.error(err);
    return err;
  }
};

/**
 * Get asset history
 * @param {string} assetId the id of the asset
 * @return {Promise} the asset history
 */
const getAssetHistory = async assetId => {
  logger.debug(i18n.__('Get asset history'));
  logger.debug(i18n.__('assetId'), assetId);

  const history = [];

  /**
   * Composes an asset history entry
   * @param {string} txId the transaction id
   * @param {string[]} from the public keys of the asset senders
   * @param {string[]} to the public keys of the asset receivers
   * @param {string} amount the amount transfered
   * @param {number} timestamp the transaction time (client)
   * @return {object} the asset history entry
   */
  function composeAssetHistoryEntry(txId, from, to, amount, timestamp) {
    const histroryEntry = {
      txId: txId,
      from: from,
      to: to,
      amount: amount,
      timestamp: timestamp
    };
    return histroryEntry;
  }

  /**
   * Flattens the keys of a transaction input and eliminates duplicates
   * @param {object[]} inputs the transaction inputs
   * @return {string[]} the keys
   */
  function flattenInputKeysAndEliminateDuplicates(inputs) {
    return inputs
      .map(input => input.owners_before)
      .join()
      .split(',')
      .filter((item, index, arr) => arr.indexOf(item) == index);
  }

  /**
   * Flattens the keys of a transaction output and eliminates duplicates
   * @param {object[]} outputs the transaction outputs
   * @param {string} publicKey the public key to filter
   * @return {string[]} the keys
   */
  function flattenOutpuKeysAndEliminateDuplicates(outputs, publicKey) {
    return outputs
      .filter(output => output.public_keys.indexOf(publicKey) == -1)
      .map(output => output.public_keys)
      .join()
      .split(',')
      .filter((item, index, arr) => arr.indexOf(item) == index);
  }

  const createTx = await getTxById(assetId);
  if (createTx) {
    {
      const txId = createTx.txId;
      const from = flattenInputKeysAndEliminateDuplicates(createTx.txData.inputs);
      const to = flattenOutpuKeysAndEliminateDuplicates(createTx.txData.outputs);
      const amount = createTx.txData.outputs.reduce((sum, output) => sum + Number(output.amount), 0);
      const timestamp = createTx.txMetadata.project.timestamp;
      const entry = composeAssetHistoryEntry(txId, from, to, amount, timestamp);

      history.push(entry);
    }

    const {tmTx} = models;
    const filter = {where: {'txData.asset.id': assetId}};
    let transferTxs = await tmTx.find(filter);

    transferTxs.forEach(transferTx => {
      const txId = transferTx.txId;
      const from = flattenInputKeysAndEliminateDuplicates(transferTx.txData.inputs);
      const to = flattenOutpuKeysAndEliminateDuplicates(transferTx.txData.outputs);
      const amount = transferTx.txData.outputs.reduce((sum, output) => sum + Number(output.amount), 0);
      const timestamp = transferTx.txMetadata.project.timestamp;

      const entry = composeAssetHistoryEntry(txId, from, to, amount, timestamp);

      history.push(entry);
    });
    return history;
  }
};

/**
 * Get transaction history
 * @param {string} publicKey Public key of the user
 * @param {string} assetType Type of Digital Asset
 * @return {Promise} the transaction history
 */
const getTxHistory = async(publicKey, assetType) => {
  logger.debug(i18n.__('Get transaction history'));
  logger.debug(i18n.__('Public key'), publicKey);
  logger.debug(i18n.__('Type of asset'), assetType);

  /**
   * Creates a tx history entry
   * @param {string} txId the transaction id
   * @param {string} direction 'in', 'out' or 'create'
   * @param {string[]} from the public keys of the asset senders
   * @param {string[]} to the public keys of the asset receivers
   * @param {string} amount the amount transfered
   * @param {string} assetType the asset type
   * @param {number} timestamp the transaction time (client)
   * @return {object} the history
   */
  function composeTxHistoryEntry(txId, direction, from, to, amount, assetType, timestamp) {
    const histroryEntry = {
      txId: txId,
      direction: direction,
      from: from,
      to: to,
      amount: amount,
      assetType: assetType,
      timestamp: timestamp
    };
    return histroryEntry;
  }

  /**
   * Flattens the keys of a transaction input and eliminates duplicates
   * @param {object[]} inputs the transaction inputs
   * @return {string[]} the keys
   */
  function flattenInputKeysAndEliminateDuplicates(inputs) {
    return inputs
      .map(input => input.owners_before)
      .join()
      .split(',')
      .filter((item, index, arr) => arr.indexOf(item) == index);
  }

  /**
   * Flattens the keys of a transaction output and eliminates duplicates
   * @param {object[]} outputs the transaction outputs
   * @param {string} publicKey the public key to filter
   * @return {string[]} the keys
   */
  function flattenOutpuKeysAndEliminateDuplicates(outputs, publicKey) {
    return outputs
      .filter(output => output.public_keys.indexOf(publicKey) == -1)
      .map(output => output.public_keys)
      .join()
      .split(',')
      .filter((item, index, arr) => arr.indexOf(item) == index);
  }

  let history = [];
  const inputsAndOutputsTxs = await getInputsAndOutputs(publicKey, assetType);
  const inputTxs = inputsAndOutputsTxs.inputs;
  const outputTxs = inputsAndOutputsTxs.outputs;

  // How to retrieve the history of transactions for a public key?
  // 1. Incoming transactions
  //    a) self created asset
  //    b) received asset
  // 2. Ougoing transactions
  //    a) transfered asset

  // add incoming transactions to history
  await Promise.all(outputTxs.map(async output => {
    const outputTx = await output.tx.get();
    const txId = output.txId;
    const direction = output.operation == 'CREATE' ? 'create' : 'in';
    const from = flattenInputKeysAndEliminateDuplicates(outputTx.txData.inputs);
    const to = flattenOutpuKeysAndEliminateDuplicates(outputTx.txData.outputs);
    const amount = Number(output.amount);
    const timestamp = outputTx.txMetadata.project.timestamp;
    const incomingEntry = composeTxHistoryEntry(txId, direction, from, to, amount, assetType, timestamp);
    history.push(incomingEntry);
    return Promise.resolve();
  }));

  // add spending transactions to history
  await Promise.all(inputTxs.map(async input => {
    const inputTx = await input.tx.get();
    const txId = input.txId;
    const direction = 'out';
    const from = flattenInputKeysAndEliminateDuplicates(inputTx.txData.inputs);
    const to = flattenOutpuKeysAndEliminateDuplicates(inputTx.txData.outputs, publicKey);
    const amount = inputTx.txData.outputs
      .filter(output => output.public_keys.indexOf(publicKey) == -1)
      .reduce((sum, output) => sum + Number(output.amount), 0);
    const timestamp = inputTx.txMetadata.project.timestamp;
    const outgoingEntry = composeTxHistoryEntry(txId, direction, from, to, amount, assetType, timestamp);

    history.push(outgoingEntry);
    return Promise.resolve();
  }));

  history = history.sort((a, b) => a.timestamp - b.timestamp);
  logger.debug('Found ' + history.length + ' history entries.');
  return history;
};

/**
 * Get asset owned by a owner
 * @param {string} publicKey Public key of the user
 * @param {string} assetType Type of Digital Asset
 * @return {Number} asset for the given Public Key and Asset Type
 */
const getAssetsByOwner = async(publicKey, assetType) => {
  try {
    let allAssets = [];
    const unspentOutputTxs = await getUnspentOutputs(publicKey, assetType);
    await Promise.all(unspentOutputTxs.map(async output => {
      let item = {};
      const tx = await output.tx.get();
      item.txId = output.txId;
      item.metadata = tx.txData.metadata;
      if (output.operation === 'TRANSFER') {
        let asset = await tx.asset.get();
        item.data = asset.data;
      } else
        item.data = tx.txData.asset.data;
      allAssets.push(item);
      return Promise.resolve();
    }));
    return allAssets;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

const getOwnerOfAsset = async assetId => {
  /**
   * Flattens the keys of a transaction input and eliminates duplicates
   * @param {object[]} inputs the transaction inputs
   * @return {string[]} the keys
   */
  function flattenInputKeysAndEliminateDuplicates(inputs) {
    return inputs
      .map(input => input.owners_before)
      .join()
      .split(',')
      .filter((item, index, arr) => arr.indexOf(item) == index);
  }

  /**
   * Flattens the keys of a transaction output and eliminates duplicates
   * @param {object[]} outputs the transaction outputs
   * @param {string} publicKey the public key to filter
   * @return {string[]} the keys
   */
  function flattenOutpuKeysAndEliminateDuplicates(outputs, publicKey) {
    return outputs
      .filter(output => output.public_keys.indexOf(publicKey) == -1)
      .map(output => output.public_keys)
      .join()
      .split(',')
      .filter((item, index, arr) => arr.indexOf(item) == index);
  }

  try {
    let owners = [];
    const createTx = await getTxById(assetId);
    let owner;

    if (createTx) {
      {
        const from = flattenInputKeysAndEliminateDuplicates(createTx.txData.inputs);
        owner = from;
        const timestamp = createTx.txMetadata.project.timestamp;
        const entry = {ownerPublicKey: owner, timestamp: timestamp};
        owners.push(entry);
      }

      const {tmTx} = models;
      const filter = {where: {'txData.asset.id': assetId}};
      let transferTxs = await tmTx.find(filter);

      transferTxs.forEach(transferTx => {
        const owner = flattenOutpuKeysAndEliminateDuplicates(transferTx.txData.outputs);
        const timestamp = transferTx.txMetadata.project.timestamp;
        const entry = {ownerPublicKey: owner, timestamp: timestamp};
        owners.push(entry);
      });
      owners = owners.sort((a, b) => a.timestamp - b.timestamp);
      return owners.pop();
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * find txs using metadata
 * @param {object} clientMetadata client metadata object for search
 * @return {array} array of all txs
 */
const findTxByProperty = async clientMetadata => {
  try {
    const {tmMetadata, tmTx} = models;
    const fetchedTxs = await tmMetadata.find();
    let txs = [];
    const obj = {client: clientMetadata};
    const metadataSet = new Set();
    for (let i = 0; i < fetchedTxs.length; i++) {
      for (var x in fetchedTxs[i].client) {
        if (fetchedTxs[i].client[x] == obj.client[x]) {
          metadataSet.add(fetchedTxs[i].txId);
        }
      }
    }
    let txIds = Array.from(metadataSet);
    const filter = {where: {txId: {inq: txIds}}};
    txs = await tmTx.find(filter);
    return txs;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * find assets using metadata
 * @param {object} clientMetadata client metadata object for search
 * @return {array} array of all assets
 */
const findAssetByProperty = async clientMetadata => {
  try {
    const {tmMetadata, tmAsset} = models;
    const fetchedTxs = await tmMetadata.find();
    let assets = [];
    const obj = {client: clientMetadata};
    const metadataSet = new Set();
    for (let i = 0; i < fetchedTxs.length; i++) {
      for (var x in fetchedTxs[i].client) {
        if (fetchedTxs[i].client[x] == obj.client[x]) {
          metadataSet.add(fetchedTxs[i].txId);
        }
      }
    }
    let txIds = Array.from(metadataSet);
    const filter = {where: {txId: {inq: txIds}}};
    assets = await tmAsset.find(filter);
    return assets;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * Gets the balance by aseet id for an account represented by a public key
 * @param {string} publicKey Public key of the user
 * @param {string} assetId ID of Digital Asset
 * @return {Number} balance The balance for the given Public Key and Asset ID
 */
const getBalanceByAssetId = async(publicKey, assetId) => {
  try {
    const {tmAsset} = models;
    logger.debug(i18n.__('Get balance'));
    logger.debug(i18n.__('Public key'), publicKey);
    logger.debug(i18n.__('Id of asset'), assetId);
    let assetTxs = await tmAsset.find({
      where: {
        or: [
          {txId: assetId},
          {"data.id": assetId}
        ]
      },
      include: [{
        relation: "tx",
        scope: {
          include: [{
            relation: "inputs"
          }, {
            relation: "outputs"
          }]
        }
      }]
    });
    let outputs = [];
    let inputs = [];
    assetTxs.forEach(asset => {
      asset = asset.toJSON();
      outputs = [...outputs, ...asset.tx.outputs.filter(o => o.public_key === publicKey)];
      inputs = [...inputs, ...asset.tx.inputs.filter(i => i.fulfills)];
    });
    outputs = outputs.filter(o => !inputs.some(i => i.fulfills.transaction_id === o.txId && i.fulfills.output_index === o.outputIndex));
    const balance = outputs.reduce((sum, output) => {
      return sum + Number(output.amount); // extracting the first element but it should handle multiple indexes
    }, 0);
    logger.debug(i18n.__(`Balance for public key %s and for asset $s is %s %s`, publicKey, assetId, balance));
    return balance;
  } catch (err) {
    logger.error(err);
    return err;
  }
};

/**
 * API/Service/ng-rt-digitalAsset
 *
 * @module API/Service/ng-rt-digitalAsset
 * @type {Object}
 */

module.exports = services => {
  i18n = services.get("i18n");
  models = services.get('loopbackApp').models;
  metricsClient = services.get('metricsClient');

  return {
    postTx,
    getBalance,
    getTxHistory,
    getAssetHistory,
    getAssetById,
    getTxById,
    getInputsAndOutputs,
    getInputs,
    getOutputs,
    getAssetsByOwner,
    getOwnerOfAsset,
    findTxByProperty,
    findAssetByProperty,
    getBalanceByAssetId
  };
};
