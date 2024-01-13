'use strict';

const logger = require('log4js').getLogger('ng-rt-digitalAsset.service.digitalAsset');
const daDriver = require('ng-rt-digitalAsset-sdk').digitalAssetDriver;
let models = {};

/**
 * Constructs the full remote URL of the blockchain server
 * @private
 * @param {object} assetDefinition the DigitalAssetDefinition of the asset
 * @param {object} configService the configuration service
 * @return {String} the full remote URL of the blockchain server
 */
const getTendermintServerUrl = (assetDefinition, configService) => {
  let blockchainIPAddress = assetDefinition.HTTPBlockchainIPAddress;
  let blockchainPort = assetDefinition.HTTPBlockchainPort;

  if (assetDefinition.HTTPBlockchainIPAddress === '*default') {
    logger.trace('assetDef.HTTPBlockchainIPAddress === default');

    blockchainIPAddress = configService.get('tendermintHost');
    blockchainPort = configService.get('tendermintPort');
  }

  logger.trace('Resolved blockchain server IP-Address:  %s', blockchainIPAddress);
  logger.trace('Resolved blockchain server port: %s', blockchainPort);

  return `http://${blockchainIPAddress}:${blockchainPort}/`;
};

/**
 * API/Service/ng-rt-digitalAsset
 *
 * @module API/Service/ng-rt-digitalAsset
 * @type {Object}
 */

module.exports = services => {
  const configService = services.get('configService');
  const i18n = services.get('i18n');
  const primaryBlockchainProvider = configService.get('primaryBlockchainProvider');
  const keyPairService = services.get('resolveKeyPair');

  models = services.get("loopbackApp").models;

  /**
   * Resolves the user or domain
   * @param {object} req Request object
   * @return {object} Resolved user
   */
  const resolveUser = req => {
    let user;
    if (req.user && Object.keys(req.user).length !== 0) {
      user = req.user;
    } else {
      user = {domainId: configService.get('defaultDomainId')};
    }
    return user;
  };

  /**
   * prepare the digital asset
   * @param {Object} type assetType
   * @param {Object} payload the payload
   * @param {string} ownerPubKey Public Key of the asset owner
   * @return {object} return digital asset
   */
  let prepareDigitalAsset = (type, payload, ownerPubKey) => {
    return new Promise((resolve, reject) => {
      logger.debug('executing digitalAssets.js create asset');
      logger.debug('type :', type);
      logger.debug('payload :', payload);
      logger.debug('ownerPubKey :', ownerPubKey);
      try {
        payload = JSON.parse(payload);
      } catch (err) {
        logger.error(`Invalid payload json: ${payload}`);
        return reject({
          message: `Invalid payload json: ${payload}`
        });
      }
      var DigitalAssetDefinition = models.digitalAssetDefinition;
      DigitalAssetDefinition.findOne({
        where: {
          digitalAsset: type
        }
      }, (err, assetDef) => {
        if (err)
          logger.error(err);
        if (!assetDef)
          return reject('No digital asset type: ');

        if (ownerPubKey) {
          if (!assetDef.createTransactionAllowedByUser)
            return reject('CREATE of ' + type + ' digital asset is not allowed for user');
          logger.trace('createTransactionAllowedByUser :', assetDef.createTransactionAllowedByUser);
        } else {
          if (!assetDef.createTransactionAllowedBySystem)
            return reject('CREATE of ' + type + ' digital asset is not allowed for system');
          logger.trace('createTransactionAllowedBySystem :', assetDef.createTransactionAllowedBySystem);
          ownerPubKey = configService.get('keypair.public');
        }
        logger.trace('ownerPubKey :', ownerPubKey);
        logger.trace('payload :', payload);
        resolve({assetDef: assetDef, payload: payload});
      });
    });
  };

  let prepareMeta = (user, meta) => {
    if (!meta)
      meta = {};
    logger.trace("context user", user);
    if (user) {
      meta.user = user;
    } else {
      logger.debug('No user info in context for digitalAsset');
      meta.user = {
        domainId: configService.get('defaultDomainId')
      };
    }
    return meta;
  };
  /**
   * create unsigned digital asset template
   * @param {Object} type assetType
   * @param {Object} payload the payload
   * @param {string} clientId clientId
   * @return {object} return unsigned digital asset
   */
  const createAssetSignedByClient = async(type, payload, clientId) => {
    let user = null;
    let result = await prepareDigitalAsset(type, payload, null);
    let meta = prepareMeta(user);
    let txData = {
      tx: result.payload,
      meta: meta
    };
    return txData;
  };

  /**
   * Gets the AssetDefinition for a given digital asset type
   * @param {String} assetType the digital asset type
   * @return {object} the AssetDefinition or null if it does not exist
   */
  const getAssetDefinition = async assetType => {
    logger.debug(i18n.__('get asset definitions'));

    const assetDefinitionModel = models.digitalAssetDefinition;
    try {
      return await assetDefinitionModel.findOne({where: {digitalAsset: assetType}});
    } catch (error) {
      logger.error('Error while reading asset definitions', error);
      throw error;
    }
  };

  /**
   * Validates the correctness of the JSON schema of the data
   * @param {*} assetData the asset data
   * @return {boolean} true if the verification was successful, false otherwise
   */
  const validateTransactionJsonSchema = assetData => {
    return true;
  };

  /**
   * @param {*} assetDefinition the digital asset definition
   * @return {boolean} true when the primary blockchain provider matches the provider required by the asset, false otherwise
   */
  const checkBlockchainProvider = assetDefinition => {
    const isSameProvider = assetDefinition.blockchainProvider === primaryBlockchainProvider;
    if (!isSameProvider) {
      logger.error('PrimaryBlockchainProvider is "' + primaryBlockchainProvider + '", but the digital asset requires ' + assetDefinition.blockchainProvider);
    }
    return isSameProvider;
  };

  /**
   * Checks the digital asset transaction
   * @param {Object} assetDef the digital asset definition
   * @param {Object} signedTx the payload
   * @param {string} ownerKeyPair the keypair of the asset owner
   */
  const checkDigitalAssetTx = (assetDef, signedTx, ownerKeyPair) => {
    const metricsClient = services.get("metricsClient");
    metricsClient.increment("digitalAsset, createAsset");
    if (ownerKeyPair && ownerKeyPair.publicKey) {
      if (!assetDef.createTransactionAllowedByUser)
        throw new Error('CREATE of ' + assetDef.digitalAsset + ' digital asset is not allowed for user');
      logger.trace('createTransactionAllowedByUser :', assetDef.createTransactionAllowedByUser);
    } else {
      if (!assetDef.createTransactionAllowedBySystem)
        throw new Error('CREATE of ' + assetDef.digitalAsset + ' digital asset is not allowed for system');
      logger.trace('createTransactionAllowedBySystem :', assetDef.createTransactionAllowedBySystem);
      let keypair = keyPairService.resolveKeyPair(null, 'system');
      ownerKeyPair.publicKey = keypair.publicKey;
      ownerKeyPair.privateKey = keypair.privateKey;
    }
    // validate JSON schema
    if (assetDef.validateSchema) {
      const validatedSchema = validateTransactionJsonSchema(signedTx);
      if (!validatedSchema) {
        throw new Error('Transaction schema is not valid');
      }
    }
  };

  /**
   * Compose internal transaction metadata
   * @param {object} user the user
   * @return {object} the composed metadata
   */
  const composeProjectTxMetadata = user => {
    
    return {
      timestamp: Date.now(),
      user: user
    };
  };

  /**
   * Chcek transaction outputs
   * @param {object[]} outputs - array of transaction outputs
   * @param {object} ownerKeyPairs transaction owner keypair
   */
  const checkOutputs = (outputs, ownerKeyPairs) => {
    if (typeof outputs === 'string')
      outputs = {publicKey: ownerKeyPairs.publicKey, amount: outputs};
    if (!Array.isArray(outputs)) {
      outputs = [outputs];
    }
  };

  const validateOutputs = (outputs, minValue, maxValue) => {
    if (!outputs)
      return; // throw new Error('outputs is required for transaction');
    if (!Array.isArray(outputs))
      return; // throw new Error("outputs must be a array");
    if (outputs.length === 0)
      return; // throw new Error('outputs lenght must be great than 0');
    outputs.forEach(o => {
      if (!o.amount && o.amount !== 0)
        throw new Error('Amount is required field for transaction output');
      if (isNaN(o.amount))
        throw new Error("Can't parse output amount");
      const numberValue = Number(o.amount);
      if (numberValue < 0)
        throw new Error("Amount of output can't be negative number");
      if (minValue > 0 && numberValue < minValue)
        throw new Error('Output amount less than possible amount fot this digital asset type');
      if (maxValue > 0 && numberValue > maxValue)
        throw new Error('Output amount great than possible amount fot this digital asset type');
    });
  };

  /**
   * Check is asset definitions allows divisible assets
   * @param {object} assetDefinition asset definition
   * @param {object} signedTx signed transaction
   */
  const checkDivisibleAsset = (assetDefinition, signedTx) => {
    if (!assetDefinition.divisibleAsset) {
      if (signedTx.outputs.length > 1 || signedTx.inputs.length > 1)
        throw new Error("Divisible asset prohibited");
    }
    return;
  };

  /**
   * Create asset
   * @param {Object} ownerKeyPair owner key pair
   * @param {Object} txData Transaction data
   * @param {Object[]} outputs array of transaction outputs (Array item: {amount: `amount of share`, publicKey: `recepient public key`})
   * @param {Object} txMetadata Metadata of the transaction
   * @param {boolean} isSigned indicates if the data is already signed or not
   * @param {Object} user Logged in user
   * @param {string} assetType Type of the digital asset e.g. tendermint_blob
   * @param {string} assetFormat Format of the digital asset
   * @param {string} txMethod Type of method to use for posting the transaction e.g Sync, Async, Commit
   * @return {Promise} Created and posted (to blockchain) transaction
   */
  const createAsset = async(ownerKeyPair, txData, outputs, txMetadata, isSigned, user, assetType, assetFormat, txMethod) => {
    try {
      logger.debug(i18n.__('Create asset'));
      logger.debug(i18n.__('Signed tx'), txData);
      logger.debug(i18n.__('Type'), assetType);
      logger.debug(i18n.__('TxMethod'), txMethod);

      const tendermintService = services.get('bc.abci-project');

      const assetDefinition = await getAssetDefinition(assetType);
      if (!assetDefinition) {
        throw new Error('could not find digital asset definition for type ' + assetType);
      }

      const projectMetadata = composeProjectTxMetadata(user);
      const serverURL = getTendermintServerUrl(assetDefinition, configService);

      if (!checkBlockchainProvider(assetDefinition)) {
        throw new Error('Blockchain provider "' + assetDefinition.blockchainProvider + '" is not supported');
      }
      let assetDescriptor = {
        assetType: assetType,
        assetFormat: assetFormat,
        isFungible: assetDefinition.fungibleAsset
      };
      if (!ownerKeyPair)
        ownerKeyPair = {};
      checkDigitalAssetTx(assetDefinition, txData, ownerKeyPair);
      checkOutputs(outputs, ownerKeyPair);
      switch (assetDefinition.blockchainDriver) {
        case 'abciDriver':
          {
            throw new Error('abci driver is not implemented');
          }
        case 'bdbDriver':
          {
            let signedTx;
            if (isSigned) {
              signedTx = txData;
            } else {
              signedTx = daDriver.composeAndSignCreateTx(txData,
                outputs,
                txMetadata,
                ownerKeyPair.publicKey,
                ownerKeyPair.privateKey);
            }
            checkDivisibleAsset(assetDefinition, signedTx);
            validateOutputs(signedTx.outputs, assetDefinition.minAmountValue, assetDefinition.maxAmountValue);
            const result = await tendermintService.postTx(signedTx, projectMetadata, assetDescriptor, txMethod, serverURL);
            logger.debug(i18n.__('Tx successfully posted'), result.result.hash);
            return result;
          }
        default:
          {
            throw new Error('Blockchain driver ' + assetDefinition.blockchainDriver + ' is not supported');
          }
      }
    } catch (error) {
      logger.error(error.message);
      throw error;
    }
  };
  /**
   * Get transaction by Id
   * @param  {String} id Id of transaction to find
   * @param  {Object} user Logged in user
   * @return {Promise} the transaction data
   */
  const getTx = async(id, user) => {
    try {
      logger.debug(i18n.__('Get transaction by Id'));
      logger.debug(i18n.__('Id'), id);

      const domainId = user ? user.domainId : configService.get('defaultDomainId');
      logger.debug("Domain Id:", domainId);
      const tendermintService = services.get('bc.abci-project');

      const blockchainDriver = 'bdbDriver'; // Fix: find a way to know which blockchain to read the asset from
      switch (blockchainDriver) {
        case 'abciDriver':
          {
            throw new Error('Blockchain driver ' + blockchainDriver + ' is not supported');
          }
        case 'bdbDriver':
          {
            const result = await tendermintService.getTxById(id);
            return result;
          }
        default:
          {
            throw new Error('Blockchain driver ' + blockchainDriver + ' is not supported');
          }
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  };

  /**
   * Get asset by Id
   * @param  {String} id Id of asset to find
   * @param  {Object} user Logged in user
   * @return {Promise} the asset data
   */
  const getAsset = async(id, user) => {
    logger.debug(i18n.__('Get Asset by Id'));
    logger.debug(i18n.__('Id'), id);

    const domainId = user ? user.domainId : configService.get('defaultDomainId');
    logger.debug("Domain Id:", domainId);
    const tendermintService = services.get('bc.abci-project');

    const blockchainDriver = 'bdbDriver'; // Fix: find a way to know which blockchain to read the asset from
    switch (blockchainDriver) {
      case 'abciDriver':
        {
          throw new Error('Blockchain driver ' + blockchainDriver + ' is not supported');
        }
      case 'bdbDriver':
        {
          const result = await tendermintService.getAssetById(id);
          return result;
        }
      default:
        {
          throw new Error('Blockchain driver ' + blockchainDriver + ' is not supported');
        }
    }
  };

  /**
   * Transfer asset
   * @param {Object|Object[]} senderKeypair Sender's keypair
   * @param {string|Object[]} outputs Public key of the receiver and output amount
   * @param {Object|String|Object[]|string[]} txData Transaction data
   * @param {Object} txMetadata Metadata of the transaction
   * @param {boolean} isSigned indicates if the data is already signed or not
   * @param {Object} user Logged in user
   * @param {string} assetType Type of the digital asset e.g. tendermint_blob
   * @param {string} assetFormat Format of the digital asset
   * @param {string} txMethod Type of method to use for posting the transaction e.g Sync, Async, Commit
   * @return {Promise} Created and posted (to blockchain) transaction
   */
  const transferAsset = async(senderKeypair, outputs, txData, txMetadata, isSigned, user, assetType, assetFormat, txMethod) => {
    logger.debug(i18n.__('Transfer asset'));
    logger.debug(i18n.__('Sender pubkey'), senderKeypair);
    logger.debug(i18n.__('Receivers'), outputs);
    logger.debug(i18n.__('Type'), assetType);

    const tendermintService = services.get('bc.abci-project');

    const projectMetadata = composeProjectTxMetadata(user);

    const assetDefinition = await getAssetDefinition(assetType);
    if (!assetDefinition) {
      throw new Error('could not find digital asset definition for type ' + assetType);
    }

    const serverURL = getTendermintServerUrl(assetDefinition, configService);
    let assetDescriptor = {
      assetType: assetType,
      assetFormat: assetFormat
    };

    if (!checkBlockchainProvider(assetDefinition)) {
      throw new Error('Blockchain provider "' + assetDefinition.blockchainProvider + '" is not supported');
    }

    switch (assetDefinition.blockchainDriver) {
      case 'abciDriver':
        {
          throw new Error('Blockchain driver ' + assetDefinition.blockchainDriver + ' is not supported');
        }

      case 'bdbDriver':
        {
          let signedTx;
          if (isSigned) {
            signedTx = txData;
          } else {
            // txData must be the 'unspentTransactionId' in this case
            const getUnspentTx = async data => {
              let index = 0;
              let tx = data;
              if (typeof data === 'object') {
                tx = data.tx;
                if (data.output_index)
                  index = data.output_index;
              }
              if (typeof tx === 'string') {
                let txId = tx;
                tx = await tendermintService.getTxById(txId);
                tx = tx.txData;
                const assetData = await tendermintService.getAssetById(txId);
                tx.asset = assetData.data;
              }
              return Promise.resolve({tx: tx, output_index: index});
            };
            if (!Array.isArray(txData)) {
              txData = [txData];
            }
            let unspentTxs = await Promise.all(txData.map(ut => getUnspentTx(ut)));
            signedTx = await daDriver.composeAndSignTransferTx(unspentTxs, txMetadata, outputs, senderKeypair.privateKey);
          }
          checkDivisibleAsset(assetDefinition, signedTx);
          validateOutputs(signedTx.outputs, assetDefinition.minAmountValue, assetDefinition.maxAmountValue);
          const result = await tendermintService.postTx(signedTx, projectMetadata, assetDescriptor, txMethod, serverURL);
          logger.debug(i18n.__('Tx successfully posted'), result.result.hash);
          return result;
        }
      default:
        {
          throw new Error('Blockchain driver ' + assetDefinition.blockchainDriver + ' is not supported');
        }
    }
  };

  /**
   * check digital asset defiinition is not fungible
   * @param {object} assetDefinition digital asset definition
   */
  const checkFungibleAsset = assetDefinition => {
    if (!assetDefinition)
      throw new Error('Digital asset definition is required for checkFungibleAsset');
    if (assetDefinition.fungibleAsset === false)
      throw new Error("Digital asset definition is not fungible");
  };

  /**
   * Get balance by asset type
   * @param {string} publicKey user public key
   * @param {string} assetType type of digitalAsset
   * @return {object} object with balance property
   */
  const getBalanceByAssetType = async(publicKey, assetType) => {
    const tendermintService = services.get('bc.abci-project');
    const assetDefinition = await getAssetDefinition(assetType);
    if (!assetDefinition) {
      throw new Error('could not find digital asset definition for type ' + assetType);
    }
    switch (assetDefinition.blockchainDriver) {
      case 'abciDriver':
        {
          throw new Error('Blockchain driver ' + assetDefinition.blockchainDriver + ' is not supported');
        }
      case 'bdbDriver':
        {
          checkFungibleAsset(assetDefinition);
          let result = await tendermintService.getBalance(publicKey, assetType);
          const balance = {
            balance: result
          };
          return balance;
        }
      default:
        {
          throw new Error('Blockchain driver ' + assetDefinition.blockchainDriver + ' is not supported');
        }
    }
  };

  /**
   * Get balance by asset id
   * @param {string} publicKey user public key
   * @param {string} assetId id of digitalAsset
   * @return {object}  object with balance property
   */
  const getBalanceByAssetId = async(publicKey, assetId) => {
    logger.debug(i18n.__('Get balance'));
    logger.debug(i18n.__('Public key'), publicKey);
    logger.debug(i18n.__('Asset ID'), assetId);
    let assetType;
    const tendermintService = services.get('bc.abci-project');
    if (!assetType && assetId) {
      const asset = await tendermintService.getAssetById(assetId);
      if (!asset)
        throw new Error("Can't find asset");
      assetType = asset.type;
    }
    const assetDefinition = await getAssetDefinition(assetType);
    if (!assetDefinition) {
      throw new Error('could not find digital asset definition for asset ' + assetId);
    }

    switch (assetDefinition.blockchainDriver) {
      case 'abciDriver':
        {
          throw new Error('Blockchain driver ' + assetDefinition.blockchainDriver + ' is not supported');
        }
      case 'bdbDriver':
        {
          let result = await tendermintService.getBalanceByAssetId(publicKey, assetId);
          const balance = {
            balance: result
          };
          return balance;
        }
      default:
        {
          throw new Error('Blockchain driver ' + assetDefinition.blockchainDriver + ' is not supported');
        }
    }
  };

  /**
   * Get balance
   * @param {string} publicKey Public key of the user
   * @param {string} assetType Type of Digital Asset
   * @param {string} assetId Id of DigitalAsset
   * @return {Promise} the balance
   */
  const getBalance = async(publicKey, assetType, assetId) => {
    logger.debug(i18n.__('Get balance'));
    logger.debug(i18n.__('Public key'), publicKey);
    logger.debug(i18n.__('Type of asset'), assetType);
    logger.debug(i18n.__('Asset ID'), assetId);

    const tendermintService = services.get('bc.abci-project');
    if (!assetType && assetId) {
      const asset = await tendermintService.getAssetById(assetId);
      assetType = asset.type;
    }
    const assetDefinition = await getAssetDefinition(assetType);
    if (!assetDefinition) {
      throw new Error('could not find digital asset definition for type ' + assetType);
    }

    switch (assetDefinition.blockchainDriver) {
      case 'abciDriver':
        {
          throw new Error('Blockchain driver ' + assetDefinition.blockchainDriver + ' is not supported');
        }
      case 'bdbDriver':
        {
          let result;
          if (assetId) {
            result = await tendermintService.getBalanceByAssetId(publicKey, assetId);
          } else {
            checkFungibleAsset(assetDefinition);
            result = await tendermintService.getBalance(publicKey, assetType);
          }
          const balance = {
            balance: result
          };
          return balance;
        }
      default:
        {
          throw new Error('Blockchain driver ' + assetDefinition.blockchainDriver + ' is not supported');
        }
    }
  };

  /**
   * Get transaction history
   * @param {string} publicKey Public key of the user
   * @param {string} assetType Type of Digital Asset
   * @return {Promise} History
   */
  const getTxHistory = async(publicKey, assetType) => {
    logger.debug(i18n.__('Get history'));
    logger.debug(i18n.__('Public key'), publicKey);
    logger.debug(i18n.__('Type of asset'), assetType);

    const tendermintService = services.get('bc.abci-project');
    const assetDefinition = await getAssetDefinition(assetType);
    if (!assetDefinition) {
      throw new Error('could not find digital asset definition for type ' + assetType);
    }

    switch (assetDefinition.blockchainDriver) {
      case 'abciDriver':
        {
          throw new Error('Blockchain driver ' + assetDefinition.blockchainDriver + ' is not supported');
        }

      case 'bdbDriver':
        {
          const result = await tendermintService.getTxHistory(publicKey, assetType);
          return result;
        }
      default:
        {
          throw new Error('Blockchain driver ' + assetDefinition.blockchainDriver + ' is not supported');
        }
    }
  };
  /**
   * create file asset
   * @param {array} files array of files
   * @return {Promise} upload file result
   */
  const createFileAsset = async files => {
    logger.debug(i18n.__('create file asset'));
    const fileServer = services.get('fileServer');
    const fileUpload = await fileServer.postUpload(files);
    logger.debug('file asset', fileUpload);
    return fileUpload;
  };

  /**
   * get file asset
   * @param {string} id fileId
   * @return {Promise} upload file result
   */
  const getFileAsset = async id => {
    logger.debug(i18n.__('create file asset'));
    const fileServer = services.get('fileServer');
    const download = await fileServer.getDownload(id);
    return download;
  };

  /**
   * Get asset history
   * @param {string} assetId the id of the asset
   * @param {string} assetType Type of Digital Asset
   * @return {Promise} History
   */
  const getAssetHistory = async(assetId, assetType) => {
    logger.debug(i18n.__('Get asset history'));
    logger.debug(i18n.__('Asset id'), assetId);
    logger.debug(i18n.__('Type of asset'), assetType);

    const tendermintService = services.get('bc.abci-project');
    const assetDefinition = await getAssetDefinition(assetType);
    if (!assetDefinition) {
      throw new Error('could not find digital asset definition for type ' + assetType);
    }

    switch (assetDefinition.blockchainDriver) {
      case 'abciDriver':
        {
          throw new Error('Blockchain driver ' + assetDefinition.blockchainDriver + ' is not supported');
        }

      case 'bdbDriver':
        {
          const result = await tendermintService.getAssetHistory(assetId);
          return result;
        }
      default:
        {
          throw new Error('Blockchain driver ' + assetDefinition.blockchainDriver + ' is not supported');
        }
    }
  };

  /**
   * Get all assets of owned by an user (public key)
   * @param {string} publicKey Public key of the user
   * @param {string} assetType Type of Digital Asset
   * @return {Promise} all the assets owned by the public key
   */
  const getAssetsByOwner = async(publicKey, assetType) => {
    logger.debug(i18n.__('Get all assets'));
    logger.debug(i18n.__('Public key'), publicKey);
    logger.debug(i18n.__('Type of asset'), assetType);

    const tendermintService = services.get('bc.abci-project');
    const assetDefinition = await getAssetDefinition(assetType);
    if (!assetDefinition) {
      throw new Error('could not find digital asset definition for type ' + assetType);
    }

    switch (assetDefinition.blockchainDriver) {
      case 'abciDriver':
        {
          throw new Error('Blockchain driver ' + assetDefinition.blockchainDriver + ' is not supported');
        }

      case 'bdbDriver':
        {
          const result = await tendermintService.getAssetsByOwner(publicKey, assetType);
          return result;
        }
      default:
        {
          throw new Error('Blockchain driver ' + assetDefinition.blockchainDriver + ' is not supported');
        }
    }
  };

  /**
   * Get current Owner of an asset
   * @param {string} assetId assetId of the asset
   * @param {string} assetType Type of Digital Asset
   * @return {Promise} current owner of the asset
   */
  const getOwnerOfAsset = async(assetId, assetType) => {
    logger.debug(i18n.__('Get owner'));
    logger.debug(i18n.__('asset Id'), assetId);
    logger.debug(i18n.__('Type of asset'), assetType);

    const tendermintService = services.get('bc.abci-project');
    const assetDefinition = await getAssetDefinition(assetType);
    if (!assetDefinition) {
      throw new Error('could not find digital asset definition for type ' + assetType);
    }

    switch (assetDefinition.blockchainDriver) {
      case 'abciDriver':
        {
          throw new Error('Blockchain driver ' + assetDefinition.blockchainDriver + ' is not supported');
        }

      case 'bdbDriver':
        {
          const result = await tendermintService.getOwnerOfAsset(assetId);
          return result;
        }
      default:
        {
          throw new Error('Blockchain driver ' + assetDefinition.blockchainDriver + ' is not supported');
        }
    }
  };

  /**
   * Get all asset definitions
   * @return {Promise} the asset definitions
   */
  const getAssetDefinitions = async() => {
    logger.debug(i18n.__('get asset definitions'));

    const assetDefinitionModel = models.digitalAssetDefinition;
    try {
      return await assetDefinitionModel.find();
    } catch (error) {
      logger.error('Error while reading asset definitions', error);
      throw error;
    }
  };

  /**
   * Create an asset definition
   * @param {object} assetDefinition new asset definition descriptor
   * @return {Promise} the created asset definition
   */
  const createAssetDefinition = async assetDefinition => {
    logger.debug(i18n.__('Create asset definition'));

    const existingAssetDefintion = await getAssetDefinition(assetDefinition.digitalAsset);
    if (existingAssetDefintion) {
      throw new Error('An asset definition with the same name does already exist');
    }

    // check of valid properties
    /*
    "digitalAsset"
    "digitalAssetDescription"
    "createTransactionAllowedBySystem"
    "transferOwnershipAllowedBySystem"
    "createTransactionAllowedByUser"
    "transferOwnershipAllowedByUser"
    "verifySignature"
    "validateSchema"
    "divisibleAsset"
    "privateAsset"
    "whiteListing"
    "blackListing"
    "assetDefinition"
    "blockchainProvider"
    "blockchainProviderVersion"
    "blockchainDriver"
    "blockchainDriverVersion"
    "HTTPBlockchainIPAddress"
    "HTTPBlockchainPort"
    */

    const assetDefinitionModel = models.digitalAssetDefinition;
    try {
      return await assetDefinitionModel.create(assetDefinition);
    } catch (error) {
      logger.error('Error while creating digital asset definition', error);
      throw error;
    }
  };

  /**
   * Get txs using metadata
   * @param {string} property property of metadata
   * @param {string} value value of the property
   * @param {string} assetType type of the asset
   * @return {Promise} all txs
   */
  const findTxByProperty = async(property, value, assetType) => {
    logger.debug(i18n.__('Get txs'));
    var clientMetadata = {};
    const tendermintService = services.get('bc.abci-project');
    const assetDef = await getAssetDefinition(assetType);
    clientMetadata[property] = value;

    switch (assetDef.blockchainDriver) {
      case 'abciDriver':
        {
          throw new Error('Blockchain driver ' + assetDef.blockchainDriver + ' is not supported');
        }

      case 'bdbDriver':
        {
          const result = await tendermintService.findTxByProperty(clientMetadata);
          return result;
        }
      default:
        {
          throw new Error('Blockchain driver ' + assetDef.blockchainDriver + ' is not supported');
        }
    }
  };
  /**
   * Get assets using metadata
   * @param {string} property property of metadata
   * @param {string} value value of the property
   * @param {string} assetType assetType of the asset
   * @return {Promise} all assets
   */
  const findAssetByProperty = async(property, value, assetType) => {
    logger.debug(i18n.__('Get assets'));
    var clientMetadata = {};
    const tendermintService = services.get('bc.abci-project');
    const assetDef = await getAssetDefinition(assetType);
    clientMetadata[property] = value;

    switch (assetDef.blockchainDriver) {
      case 'abciDriver':
        {
          throw new Error('Blockchain driver ' + assetDef.blockchainDriver + ' is not supported');
        }

      case 'bdbDriver':
        {
          const result = await tendermintService.findAssetByProperty(clientMetadata);
          return result;
        }
      default:
        {
          throw new Error('Blockchain driver ' + assetDef.blockchainDriver + ' is not supported');
        }
    }
  };

  /**
   * @param {object} pluginSettings plugin settings
   * @return {object} public values of the plugin
   */
  const getPublicPluginConfiguration = pluginSettings => {
    const pluginInfo = {
      routeValidation: pluginSettings.get('routeValidation')
    };
    return pluginInfo;
  };
  return {
    resolveUser,
    createAsset,
    transferAsset,
    getTx,
    getAsset,
    getBalance,
    getTxHistory,
    getAssetHistory,
    getAssetsByOwner,
    getOwnerOfAsset,
    createAssetDefinition,
    getAssetDefinitions,
    findTxByProperty,
    findAssetByProperty,
    getAssetDefinition,
    createFileAsset,
    getFileAsset,
    createAssetSignedByClient,
    getPublicPluginConfiguration,
    getBalanceByAssetType,
    getBalanceByAssetId
  };
};
