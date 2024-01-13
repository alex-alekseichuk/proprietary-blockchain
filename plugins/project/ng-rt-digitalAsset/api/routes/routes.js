"use strict";

const bodyParser = require("body-parser");
const logger = require("log4js").getLogger("ng-rt-digitalAsset.routes");
const path = require("path");
const multer = require("multer");
/* eslint-disable */

let services;
let server;
let i18n;
let pluginSettings;
let namespace;
let digitalAssetService;
let routeValidation;
let uploadFolder;
let uploadFolderPath;
let maxFileSize;
let allowedMimetypes;
let keyPairService;


const init = (_server, plugin) => {
  server = _server;
  services = server.plugin_manager.services;
  i18n = services.get("i18n");
  pluginSettings = server.plugin_manager.configs.get(plugin);
  namespace = pluginSettings.get("namespace");

  routeValidation = ensure => {
    return (req, res, next) => {
      let enable = pluginSettings.get("routeValidation");
      if (enable)
        return ensure(req, res, next);
      else
        return next();
    }
  }
  delete require.cache[require.resolve('../services/services/digital-asset')];
  digitalAssetService = require('../services/services/digital-asset')(services);

  delete require.cache[require.resolve('../services/services/resolveKeyPair')];
  keyPairService = require('../services/services/resolveKeyPair')(services);

  maxFileSize = pluginSettings.get("limits.maxFileSize");
  uploadFolderPath = server.plugin_manager.configs.data("ng-rt-fileServer").path
    .relative;
  allowedMimetypes = new RegExp(
    pluginSettings.get("fileFilter.allowedMimetypes"),
    "i"
  );
  uploadFolder = server.plugin_manager.configs
    .get("ng-rt-fileServer")
    .get("uploadFolder");
};

/**
 * Parse the incoming post calls to create digital asset for the different data encodings
 * @private
 * @param  {object} req the request object
 * @return {object} the data object containing the parsed data
 */
function parseDigitalAssetDataFromRequest(req) {
  let data = {};
  try {
    data.assetType = req.body.assetType;
    data.assetFormat = req.body.assetFormat;
    data.tx = req.body.tx;
    data.isSigned = req.body.isSigned ? req.body.isSigned : false;
    data.ownerPublicKey = req.body.ownerPublicKey;
    data.txMethod = req.body.txMethod;
    data.amount = req.body.amount ? req.body.amount : "1";
    data.metadata = req.body.metadata ? req.body.metadata : {};
    data.keySource = req.body.keySource ? req.body.keySource : "default";
    data.outputs = req.body.outputs;
    return data;
  } catch (error) {
    logger.error(i18n.__("Failed to parse request object."));
    throw error;
  }
}

const createAsset = async(req, res) => {
  logger.info("Create asset");
  try {
    if (!req.body.assetType || !req.body.ownerPublicKey) {
      return res.status(400).send({
        msg: i18n.__(
          'Error. "assetType" and "ownerPublicKey" are required body parameters'
        )
      });
    }

    let data = parseDigitalAssetDataFromRequest(req);

    logger.debug(i18n.__("Asset"), data.asset);
    logger.debug(i18n.__("Type"), data.type);
    logger.debug(i18n.__("Amount"), data.amount);
    logger.debug(i18n.__("Owner public key"), data.ownerPublicKey);
    logger.debug(i18n.__("Metadata"), data.metadata);

    const user = digitalAssetService.resolveUser(req);
    const resolvedOwnerKeypair = keyPairService.resolveKeyPair(
      data.ownerPublicKey,
      data.keySource
    );

    const tx = await digitalAssetService.createAsset(
      resolvedOwnerKeypair,
      data.tx,
      data.amount || data.outputs,
      data.metadata,
      data.isSigned,
      user,
      data.assetType,
      data.assetFormat,
      data.txMethod
    );

    logger.debug(i18n.__("Created tx with id: "), tx.result.hash);
    return res.send(tx);
  } catch (error) {
    logger.error(error.message);
    return res.status(400).send(error);
  }
};

const createAssetByApp = async(req, res) => {
  logger.info("Create asset by application");
  try {
    if (req.body.isSigned) {
      if (!req.body.assetType || !req.body.ownerPublicKey) {
        return res.status(400).send({
          msg: i18n.__(
            'Error. "assetType" and "ownerPublicKey" are required body parameters'
          )
        });
      }
    }
    logger.debug(i18n.__("Type of asset"), req.body.assetType);
    logger.debug(i18n.__("Public key of owner"), req.body.ownerPublicKey);

    let data = parseDigitalAssetDataFromRequest(req);
    let ownerKeyPair = keyPairService.resolveKeyPair(
      data.ownerPublicKey,
      data.keySource
    );
    // let isSigned = req.body.isSigned ? req.body.isSigned : false;

    const user = digitalAssetService.resolveUser(req);

    const tx = await digitalAssetService.createAsset(
      ownerKeyPair,
      data.tx,
      data.outputs || data.amount,
      data.metadata,
      data.isSigned,
      user,
      data.assetType,
      data.assetFormat,
      data.txMethod
    );

    logger.debug(i18n.__("Created tx with id: "), tx.result.hash);
    return res.send(tx);
  } catch (error) {
    logger.error(error.message);
    return res.status(400).send({
      msg: i18n.__(
        'Error. Asset creation failed. Contact sysadmin.'
      ) + `(${i18n.__(error.message)})`
    });
  }
};

const createFileAsset = async(req, res, next) => {
  logger.info("Create file asset");
  const fileAsset = await digitalAssetService.createFileAsset(req.files);
  logger.debug(i18n.__("Created file asset"), fileAsset);
  return res.send(fileAsset);
};

const getFileAsset = async(req, res, next) => {
  logger.info("get file asset");
  const fileAsset = await digitalAssetService.getFileAsset(req.params.fileId);
  logger.debug(i18n.__("Get file asset"), fileAsset);
  return res.send(fileAsset);
};

const getTx = async(req, res) => {
  logger.info("Get Tx");

  if (!req.params.id) {
    return res
      .status(400)
      .send({ msg: i18n.__('Error. "id" is a required query parameter') });
  }
  const user = false;
  try {
    const tx = await digitalAssetService.getTx(
      req.params.id,
      req.query.assetType,
      user
    );
    if (tx === null) {
      throw new Error("transaction not found");
    }
    logger.debug(i18n.__("Found tx"), tx);
    return res.status(200).send(tx);
  } catch (error) {
    logger.error(error.message);
    return res.status(400).send(error);
  }
};

const getAsset = async(req, res) => {
  logger.info("Get asset");

  if (!req.params.id) {
    return res
      .status(400)
      .send({ msg: i18n.__('Error. "id" is a required query parameter') });
  }
  const user = false;
  try {
    const asset = await digitalAssetService.getAsset(req.params.id, user);
    if (!asset) {
      return res.send("asset not found");
    }
    logger.debug(i18n.__("Found asset"), asset);
    return res.send(asset);
  } catch (error) {
    return res.send(error);
  }
};

const transferAsset = async(req, res) => {
  logger.info("Transfer asset");
  try {
    if (!req.body.uid || !req.body.assetType) {
      return res.status(400).send({
        msg: i18n.__(
          'Error. "uid", "amount" and "assetType" are required query parameters'
        )
      });
    }

    let data = parseDigitalAssetDataFromRequest(req);

    const user = digitalAssetService.resolveUser(req);

    const senderKeypair = keyPairService.resolveKeyPair(
      req.user.id,
      data.keySource
    );

    let receiverKeypair;
    if (req.body.uid)
      receiverKeypair = keyPairService.resolveKeyPair(
        req.body.uid,
        data.keySource
      );

    let transferTx = await digitalAssetService.transferAsset(
      senderKeypair,
      data.outputs ? data.outputs : receiverKeypair.publicKey,
      data.tx,
      data.metadata,
      data.isSigned,
      user,
      data.assetType,
      data.assetFormat,
      data.txMethod
    );
    return res.send(transferTx);
  } catch (error) {
    return res.status(400).send(error);
  }
};

const transferAssetByApp = async(req, res) => {
  logger.info("Transfer asset by application key");
  try {
    let isSigned = req.body.isSigned;

    if (!isSigned && (!req.body.receiverKey || !req.body.outputs))
      return res.status(400).send({
        msg: i18n.__(
          'Error. "receiverKey" or "outputs" are required query parameters'
        )
      });

    if (!req.body.senderKey ||
      !req.body.keySource ||
      !req.body.assetType
    ) {
      return res.status(400).send({
        msg: i18n.__(
          'Error. "senderKey", keySource", "amount" and "type" are required query parameters'
        )
      });
    }

    let assetType = req.body.assetType;
    let keySource = req.body.keySource;
    let assetFormat = req.body.assetFormat;
    // let signedTx = req.body.signedTx;
    let tx = req.body.tx;
    let txMethod = req.body.txMethod;
    let txMetadata = req.body.metadata;

    const senderKeypair = keyPairService.resolveKeyPair(
      req.body.senderKey,
      keySource
    );
    let receiverKeypair;
    if (req.body.receiverKey)
      receiverKeypair = keyPairService.resolveKeyPair(
        req.body.receiverKey,
        keySource
      );

    const user = digitalAssetService.resolveUser(req);

    let transferTx = await digitalAssetService.transferAsset(
      senderKeypair,
      req.body.outputs ? req.body.outputs : (receiverKeypair ? receiverKeypair.publicKey : null),
      tx,
      txMetadata,
      isSigned,
      user,
      assetType,
      assetFormat,
      txMethod
    );
    return res.send(transferTx);
  } catch (error) {
    logger.error(error.message);
    return res.status(400).send({
      msg: i18n.__(
        'Error. Asset transfer failed. Contact sysadmin.'
      ) + `(${i18n.__(error.message)})`
    });
  }
};

const getBalance = async(req, res) => {
  logger.info("Get balance");

  try {
    if (!req.body.assetType) {
      return res.status(400).send({
        msg: i18n.__('Error. "assetType" is a required query parameter')
      });
    }
    if (!req.params.address) {
      return res.status(400).send({
        msg: i18n.__('Error. "publicKey" is a required query parameter')
      });
    }

    const publicKey = req.params.address;
    const assetType = req.body.assetType;

    logger.debug(i18n.__("Public key"), publicKey);
    logger.debug(i18n.__("Asset type"), assetType);

    const balance = await digitalAssetService.getBalanceByAssetType(publicKey, assetType);
    res.send(balance);
  } catch (err) {
    logger.error(err.message);
    res.status(400).send({ msg: err });
  }
};

const getBalanceById = async(req, res) => {
  logger.info("Get balance");

  try {
    if (!req.params.address) {
      return res.status(400).send({
        msg: i18n.__('Error. "publicKey" is a required query parameter')
      });
    }

    if (!req.params.assetId) {
      return res.status(400).send({
        msg: i18n.__('Error. "asset id" is a required query parameter')
      });
    }

    const publicKey = req.params.address;
    const assetType = req.body.assetType;
    const assetId = req.params.assetId;

    logger.debug(i18n.__("Public key"), publicKey);
    logger.debug(i18n.__("Asset type"), assetType);
    logger.debug(i18n.__("Asset ID"), assetId);

    const balance = await digitalAssetService.getBalanceByAssetId(publicKey, assetId);
    res.send(balance);
  } catch (err) {
    logger.error(err.message);
    res.status(400).send({ msg: err });
  }
};

const getTxHistory = async(req, res) => {
  logger.info("Get transaction history");

  try {
    if (!req.body.assetType) {
      return res.status(400).send({
        msg: i18n.__('Error. "assetType" is a required query parameter')
      });
    }
    if (!req.params.address) {
      return res.status(400).send({
        msg: i18n.__('Error. "publicKey" is a required query parameter')
      });
    }

    const publicKey = req.params.address;
    const assetType = req.body.assetType;

    logger.debug(i18n.__("Public key"), publicKey);
    logger.debug(i18n.__("Asset type"), assetType);

    const history = await digitalAssetService.getTxHistory(
      publicKey,
      assetType
    );
    return res.send(history);
  } catch (err) {
    logger.error(err.message);
    res.status(400).send({ msg: err });
  }
};

const getAssetHistory = async(req, res) => {
  logger.info("Get asset history");

  try {
    if (!req.body.assetType) {
      return res.status(400).send({
        msg: i18n.__('Error. "assetType" is a required query parameter')
      });
    }
    if (!req.params.id) {
      return res.status(400).send({
        msg: i18n.__('Error. "assetId" is a required query parameter')
      });
    }

    const assetId = req.params.id;
    const assetType = req.body.assetType;

    logger.debug(i18n.__("Asset id"), assetId);
    logger.debug(i18n.__("Asset type"), assetType);

    const history = await digitalAssetService.getAssetHistory(
      assetId,
      assetType
    );
    return res.send(history);
  } catch (err) {
    logger.error(err.message);
    res.status(400).send({ msg: err });
  }
};

const getAssetsByOwner = async(req, res) => {
  logger.info("Get asset by Owner");

  try {
    if (!req.body.assetType) {
      return res.status(400).send({
        msg: i18n.__('Error. "assetType" is a required query parameter')
      });
    }
    if (!req.params.address) {
      return res.status(400).send({
        msg: i18n.__('Error. "publicKey" is a required query parameter')
      });
    }

    const publicKey = req.params.address;
    const assetType = req.body.assetType;

    logger.debug(i18n.__("Public key"), publicKey);
    logger.debug(i18n.__("Asset type"), assetType);

    const assets = await digitalAssetService.getAssetsByOwner(
      publicKey,
      assetType
    );
    return res.send(assets);
  } catch (err) {
    logger.error(err.message);
    res.status(400).send({ msg: err });
  }
};

const getOwnerOfAsset = async(req, res) => {
  logger.info("Get asset by Owner");

  try {
    if (!req.params.id) {
      return res.status(400).send({
        msg: i18n.__('Error. "assetId" is a required query parameter')
      });
    }
    if (!req.body.assetType) {
      return res.status(400).send({
        msg: i18n.__('Error. "assetType" is a required query parameter')
      });
    }
    const assetId = req.params.id;
    const assetType = req.body.assetType;

    logger.debug(i18n.__("asset Id"), assetId);
    logger.debug(i18n.__("Asset type"), assetType);

    const owner = await digitalAssetService.getOwnerOfAsset(assetId, assetType);
    return res.send(owner);
  } catch (err) {
    logger.error(err.message);
    res.status(400).send({ msg: err });
  }
};

const createAssetDefinition = async(req, res) => {
  logger.info("Create asset definition");

  const assetDefinition = req.body.assetDefinition;
  if (!assetDefinition) {
    return res.status(400).send({
      msg: i18n.__('Error. "assetDefinition" is a required body parameters')
    });
  }

  logger.debug(i18n.__("Asset Definition"), assetDefinition);

  try {
    await digitalAssetService.createAssetDefinition(assetDefinition);

    return res.send(assetDefinition);
  } catch (err) {
    logger.error(err.message);
    res.status(400).send({ msg: err.message });
  }
};

const getAssetDefinitions = async(req, res) => {
  logger.info("Get asset definitions");

  try {
    const assetDefinitions = await digitalAssetService.getAssetDefinitions();

    return res.send(assetDefinitions);
  } catch (err) {
    logger.error(err.message);
    res.status(400).send({ msg: err.message });
  }
};

const getAssetDefinition = async(req, res) => {
  logger.info("Get asset definitions");

  try {
    if (!req.params.name) {
      return res.status(400).send({
        msg: i18n.__('Error. "assetType" is a required query parameter')
      });
    }
    const assetType = req.params.name;
    const assetDefinition = await digitalAssetService.getAssetDefinition(
      assetType
    );
    if (null === assetDefinition) {
      throw new Error("asset definition of given type does not exist");
    } else {
      return res.send(assetDefinition);
    }
  } catch (err) {
    logger.error(err.message);
    res.status(400).send({ msg: err.message });
  }
};

const findTxByProperty = async(req, res) => {
  logger.info("Get txs using metadata");

  try {
    if (!req.body.value) {
      return res
        .status(400)
        .send({ msg: i18n.__('Error. "value" is a required query parameter') });
    }
    if (!req.body.assetType) {
      return res.status(400).send({
        msg: i18n.__('Error. "assetType" is a required query parameter')
      });
    }
    if (!req.body.property) {
      return res.status(400).send({
        msg: i18n.__('Error. "property" is a required query parameter')
      });
    }
    const value = req.body.value;
    const assetType = req.body.assetType;
    const property = req.body.property;

    logger.debug(i18n.__("value"), value);
    logger.debug(i18n.__("Asset type"), assetType);
    logger.debug(i18n.__("property"), property);

    const txs = await digitalAssetService.findTxByProperty(
      property,
      value,
      assetType
    );
    return res.send(txs);
  } catch (err) {
    logger.error(err.message);
    res.status(400).send({ msg: err });
  }
};

const findAssetByProperty = async(req, res) => {
  logger.info("Get asset using metadata");

  try {
    if (!req.body.value) {
      return res
        .status(400)
        .send({ msg: i18n.__('Error. "value" is a required query parameter') });
    }
    if (!req.body.assetType) {
      return res.status(400).send({
        msg: i18n.__('Error. "assetType" is a required query parameter')
      });
    }
    if (!req.body.property) {
      return res.status(400).send({
        msg: i18n.__('Error. "property" is a required query parameter')
      });
    }
    const value = req.body.value;
    const assetType = req.body.assetType;
    const property = req.body.property;

    logger.debug(i18n.__("value"), value);
    logger.debug(i18n.__("Asset type"), assetType);
    logger.debug(i18n.__("property"), property);

    const assets = await digitalAssetService.findAssetByProperty(
      property,
      value,
      assetType
    );
    return res.send(assets);
  } catch (err) {
    logger.error(err.message);
    res.status(400).send({ msg: err });
  }
};

const getPublicPluginConfiguration = async(req, res) => {
  logger.info("Get info");
  try {
    const info = await digitalAssetService.getPublicPluginConfiguration(pluginSettings);
    return res.status(200).send(info);
  } catch (error) {
    logger.error(error.message);
    return res.status(400).send(error);
  }
};

/**
 * API/Route/ng-rt-digitalAsset
 *
 * @module API/Route/ng-rt-digitalAsset
 * @type {Object}
 */
const activate = (server, plugin, pluginInstance) => {
  init(server, plugin);
  server.use(bodyParser.json()); // for parsing application/json
  server.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

  logger.debug(i18n.__("Plugin name :"), pluginInstance.name);
  logger.debug(i18n.__(`${pluginInstance.name} routes init`));

  let storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, path.join(uploadFolderPath, uploadFolder));
    },
    filename: function(req, file, cb) {
      cb(null, file.originalname);
    }
  });

  let upload = multer({
    storage: storage,
    limits: {
      fileSize: maxFileSize // Filezise in Byte
    },
    fileFilter: function(req, file, cb) {
      let mimetype = allowedMimetypes.test(file.mimetype);

      if (mimetype) {
        return cb(null, true);
      }
      cb(
        "Error: File upload only supports the following mimetypes - " +
        allowedMimetypes
      );
    }
  });

  function extendTimeout(req, res, next) {
    res.setTimeout(480000, function() {
      /* Handle timeout */
    });
    next();
  }

  /**
   * Create asset
   *
   * @name Create asset
   * @route {POST} /{namespace}/assets
   * @bodyparam {Object} assetType the data describing the digital asset
   * @bodyparam {String} type the name of the Digital Asset Definition
   * @bodyparam {String} keySource specifies which public keys will be used for call
   * @bodyparam {String} ownerPublickey public key of the asset owner
   * @bodyparam {Object} metadata transaction metadata
   * @authentication Requires user authentication
   */
  server.post(
    `/${namespace}/assets`,
    server.checkUserLogin(),
    createAsset
  );

  /**
   * Create asset by application key
   *
   * @name Create asset by application key
   * @route {POST} /{namespace}/assets/app
   * @bodyparam {Object} assetType the data describing the digital asset
   * @bodyparam {String} type the name of the Digital Asset Definition
   * @bodyparam {String} keySource specifies which public keys will be used for call
   * @bodyparam {String} ownerPublickey public key of the asset owner
   * @bodyparam {Object} metadata transaction metadata
   * @authentication Requires application authentication
   */


  server.post(
    `/${namespace}/assets/app`,
    routeValidation(server.ensureApplication(plugin)),
    createAssetByApp
  );

  /**
   * Get asset by id
   *
   * @name Get asset by id
   * @route {GET} /{namespace}/transactions/:id
   * @queryparam {String} id the identifier of the digital asset
   * @authentication Requires user authentication
   */
  server.get(`/${namespace}/transactions/:id`, server.checkUserLogin(), getAsset);

  /**
   * Get transaction by application key
   *
   * @name Get transaction by application key
   * @route {GET} /{namespace}/transactions/app/:id
   * @queryparam {String} id the identifier of the transaction
   * @authentication Requires application authentication
   */

  server.get(
    `/${namespace}/transactions/app/:id`,
    routeValidation(server.ensureApplication(plugin)),
    getTx
  );

  /**
   * Get asset by ID (with application key)
   *
   * @name Get asset by application key
   * @route {GET} /{namespace}/assets/app/:id
   * @queryparam {String} id Id of the desired digital asset
   * @authentication Requires application authentication
   */
  server.get(
    `/${namespace}/assets/app/:id`,
    routeValidation(server.ensureApplication(plugin)),
    getAsset
  );

  /**
   * Transfer asset
   *
   * @name Transfer asset
   * @route {POST} /{namespace}/assets/:id/transfer
   * @queryparam {String} senderKey Public key of sender
   * @queryparam {String} receiverKey Public key of recipient
   * @queryparam {String} keySource specifies which public keys will be used for call
   * @queryparam {String} tx specify the digital asset that you want to transfer
   * @queryparam {String} assetType Type of asset to transfer
   * @authentication Requires user authentication
   */
  server.post(
    `/${namespace}/assets/:id/transfer`,
    server.ensureLoggedIn(),
    transferAsset
  );

  /**
   * Transfer asset by application key
   *
   * @name Transfer asset by application key
   * @route {POST} /{namespace}/assets/app/:id/transfer
   * @queryparam {String} senderKey Public key of sender
   * @queryparam {String} receiverKey Public key of recipient
   * @queryparam {String} keySource specifies which public keys will be used for call
   * @queryparam {String} tx specify the digital asset that you want to transfer
   * @queryparam {String} assetType Type of asset to transfer
   * @authentication Requires application authentication
   */

  server.post(
    `/${namespace}/assets/app/:id/transfer`,
    routeValidation(server.ensureApplication(plugin)),
    transferAssetByApp
  );

  /**
   * Get balance for public key
   *
   * @name Get balance for public key
   * @route {GET} /{namespace}/accounts/:public_key/balance
   * @queryparam {String} assetType type of digital asset
   * @authentication Requires application authentication
   */
  server.get(
    `/${namespace}/accounts/:address/balance`,
    routeValidation(server.ensureApplication(plugin)),
    getBalance
  );

  /**
   * Get balance for public key
   *
   * @name Get balance by asset id for public key
   * @route {GET} /{namespace}/accounts/:public_key/balance/:assetId
   * @queryparam {String} assetType type of digital asset
   * @authentication Requires application authentication
   */
  server.get(
    `/${namespace}/accounts/:address/balance/:assetId`,
    routeValidation(server.ensureApplication(plugin)),
    getBalanceById
  );

  /**
   * Get assets by owner
   *
   * @name Get all assets belonging to an owner public key
   * @route {GET} /{namespace}/accounts/:public_key/assets
   * @queryparam {String} assetType type of digital asset
   * @queryparam {String} publicKey public key of owner
   * @authentication Requires application authentication
   */
  server.get(
    `/${namespace}/accounts/:address/assets`,
    routeValidation(server.ensureApplication(plugin)),
    getAssetsByOwner
  );

  /**
   * Get current owner of an asset
   *
   * @name Get current owner using assetId
   * @route {GET} /{namespace}/assets/:id/owner
   * @queryparam {String} assetId the identifier of the asset
   * @queryparam {String} assetType type of digital asset
   * @authentication Requires application authentication
   */
  server.get(
    `/${namespace}/assets/:id/owner`,
    routeValidation(server.ensureApplication(plugin)),
    getOwnerOfAsset
  );

  /**
   * Find transaction by property
   *
   * @name Find transaction by property
   * @route {GET} /{namespace}/transactions?property=&value=
   * @queryparam {String} value specify a property value
   * @queryparam {String} assetType type of digital asset
   * @queryparam {String} property specify a property name
   * @authentication Requires application authentication
   */
  server.get(
    `/${namespace}/transactionsByProperty`,
    routeValidation(server.ensureApplication(plugin)),
    findTxByProperty
  );

  /**
   * Find asset by property
   *
   * @name Find asset by property
   * @route {GET} /{namespace}/assets?property=&value=
   * @queryparam {String} value specify a property value
   * @queryparam {String} assetType type of digital asset
   * @queryparam {String} property specify a property name
   * @authentication Requires application authentication
   */
  server.get(
    `/${namespace}/assetsByProperty`,
    routeValidation(server.ensureApplication(plugin)),
    findAssetByProperty
  );

  /**
   * Get transaction history for public key
   *
   * @name Get transaction history for public key
   * @route {GET} /{namespace}/accounts/:public_key/txHistory
   * @queryparam {String} assetType Type of asset
   * @authentication Requires application authentication
   */
  server.get(
    `/${namespace}/accounts/:address/txHistory`,
    routeValidation(server.ensureApplication(plugin)),
    getTxHistory
  );



  /**
   * Get transaction history for an asset
   *
   * @name Get transaction history for an asset
   * @route {GET} /{namespace}/assets/:id/history
   * @queryparam {String} assetId the ID of the queried digital asset
   * @queryparam {String} assetType the type of digital asset
   * @authentication Requires application authentication
   */
  server.get(
    `/${namespace}/assets/:id/history`,
    routeValidation(server.ensureApplication(plugin)),
    getAssetHistory
  );

  /**
   * Create new asset definition
   * @name Create new asset definition
   * @route {POST} /{namespace}/assetDefinitions
   * @bodyparam {Object} assetDefinition creates a new asset definition. Definition must follow this format:
              <li>{
                  "assetDefinition":{
                      "digitalAsset": "Personal vehicle",
                          "digitalAssetDescription2": "This is a car"
              }
              }</li>
   * @authentication Requires admin user authentication
   */
  server.post(
    `/${namespace}/assetDefinitions`,
    server.ensureUserRoles(["admin"]),
    createAssetDefinition
  );

  /**
   * Gets all asset definitions
   * @name Gets all asset definitions
   * @route {GET} /{namespace}/assetDefinitions
   * @authentication Requires admin user authentication
   */
  server.get(
    `/${namespace}/assetDefinitions`,
    server.ensureUserRoles(["admin"]),
    getAssetDefinitions
  );

  /**
   * Get asset definition
   * @name Get asset definition
   * @route {GET} /{namespace}/assetDefinitions/:name
   * @authentication Requires admin user authentication
   */
  server.get(
    `/${namespace}/assetDefinitions/:name`,
    server.ensureUserRoles(["admin"]),
    getAssetDefinition
  );

  /**
   * Create file asset
   * @name Create file asset
   * @route {POST} /{namespace}/assets/file
   * @authentication Requires user authentication
   */
  server.post(
    `/${namespace}/assets/file`,
    routeValidation(server.ensureApplication(plugin)),
    extendTimeout,
    upload.any(),
    createFileAsset
  );

  /**
   * Get file asset
   * @name Get file asset
   * @route {GET} /{namespace}/assets/file/:fileId
   * @authentication Requires user authentication
   */
  server.get(
    `/${namespace}/assets/file/:fileId`,
    routeValidation(server.ensureApplication(plugin)),
    extendTimeout,
    getFileAsset
  );

  /**
   * Get public values for the plugin
   * @name Get Get public values for the plugin
   * @route {GET} /{namespace}/config
   */
  server.get(
    `/${namespace}/config`,
    getPublicPluginConfiguration
  );
};
const deactivate = {
  route1: {
    path: "/ng-rt-digitalAsset/assets",
    type: "post"
  },
  route2: {
    path: "/ng-rt-digitalAsset/assets/app",
    type: "post"
  },
  route3: {
    path: "/ng-rt-digitalAsset/transactions/:id",
    type: "get"
  },
  route4: {
    path: "/ng-rt-digitalAsset/transactions/app/:id",
    type: "get"
  },
  route5: {
    path: "/ng-rt-digitalAsset/assets/app/:id",
    type: "get"
  },
  route6: {
    path: "/ng-rt-digitalAsset/assets/:id/transfer",
    type: "post"
  },
  route7: {
    path: "/ng-rt-digitalAsset/assets/app/:id/transfer",
    type: "post"
  },
  route8: {
    path: "/ng-rt-digitalAsset/accounts/:address/balance",
    type: "get"
  },
  routeGetBalanceById: {
    path: "/ng-rt-digitalAsset/accounts/:address/balance/:assetId",
    type: "get"
  },
  route9: {
    path: "/ng-rt-digitalAsset/accounts/:address/txHistory",
    type: "get"
  },
  route10: {
    path: "/ng-rt-digitalAsset/assets/:id/history",
    type: "get"
  },
  route11: {
    path: "/ng-rt-digitalAsset/accounts/:address/assets",
    type: "get"
  },
  route12: {
    path: "/ng-rt-digitalAsset/assets/:id/owner",
    type: "get"
  },
  route13: {
    path: "/ng-rt-digitalAsset/assetDefinitions",
    type: "post"
  },
  getAssetDefinitions: {
    path: "/ng-rt-digitalAsset/assetDefinitions",
    type: "get"
  },
  route14: {
    path: "/ng-rt-digitalAsset/transactionsByProperty",
    type: "get"
  },
  route15: {
    path: "/ng-rt-digitalAsset/assetsByProperty",
    type: "get"
  },
  route16: {
    path: "/ng-rt-digitalAsset/assetDefinitions/:name",
    type: "get"
  },
  route17: {
    path: "/ng-rt-digitalAsset/assets/file",
    type: "post"
  },
  route18: {
    path: "/ng-rt-digitalAsset/assets/file/:fileId",
    type: "get"
  },
  route19: {
    path: "/ng-rt-digitalAsset/config",
    type: "get"
  }
};

module.exports = {
  init,
  activate,
  deactivate,
  createAsset,
  createAssetByApp,
  createFileAsset,
  getFileAsset,
  getTx,
  getAsset,
  transferAsset,
  transferAssetByApp,
  getBalance,
  getTxHistory,
  getAssetHistory,
  getOwnerOfAsset,
  createAssetDefinition,
  getAssetDefinitions,
  getAssetDefinition,
  findTxByProperty,
  findAssetByProperty,
  getPublicPluginConfiguration
};