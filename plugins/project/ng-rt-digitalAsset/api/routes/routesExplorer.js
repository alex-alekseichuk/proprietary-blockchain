"use strict";

const bodyParser = require("body-parser");
const logger = require("log4js").getLogger("ng-rt-digitalAsset.routesExplorer");
/* eslint-disable */

let services;
let server;
let i18n;
let pluginSettings;
let namespace;
let routeValidation;
let blockExplorer;

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
    };

    delete require.cache[require.resolve('../services/services/resolveKeyPair')];
    blockExplorer = require('../services/services/block-explorer')(services);

};
const getBlockByHash = async (req, res) => {
    logger.info("getBlockByHash");

    if (!req.params.blockHash) {
        return res
            .status(400)
            .send({ msg: i18n.__('Error. "blockHash" is a required parameter') });
    }
    if (!req.query.includeTxData) {
        req.query.includeTxData = 'false';
    }
    try {
        const block = await blockExplorer.getBlockbyHash(
            req.params.blockHash,
            JSON.parse(req.query.includeTxData)
        );
        if (block === null) {
            throw new Error("block not found");
        }
        return res.status(200).send(block);
    } catch (error) {
        logger.error(error.message);
        return res.status(400).send(error);
    }
};


const getBlockByHeight = async (req, res) => {
    logger.info("getBlockByHeight");

    if (!req.params.blockHeight) {
        return res
            .status(400)
            .send({ msg: i18n.__('Error. "blockHeight" is a required parameter') });
    }
    if (!req.query.includeTxData) {
        req.query.includeTxData = 'false';
    }
    try {
        const block = await blockExplorer.getBlockbyHeight(
            parseInt(req.params.blockHeight),
            JSON.parse(req.query.includeTxData),
        );
        if (block === null) {
            throw new Error("block not found");
        }
        return res.status(200).send(block);
    } catch (error) {
        logger.error(error.message);
        return res.status(400).send(error);
    }
};


const getBlocksWithinHeight = async (req, res) => {
    logger.info("getBlocksWithinHeight");
    let blocks;
    if ((!req.query.from && !req.query.to)) {
        return res
            .status(400)
            .send({ msg: i18n.__('Error. "from/to" any one is required parameter') });
    }
    if ((req.query.from && req.query.to)) {
        return res
            .status(400)
            .send({ msg: i18n.__('Error. either from or to is required parameter') });
    }

    if (!req.query.sortBy) {
        req.query.sortBy = 'ASC';
    }
    if (!req.query.limit) {
        req.query.limit = 20;
    }
    if (!req.query.offset) {
        req.query.offset = 0;
    }
    try {
        if (req.query.from) {
            blocks = await blockExplorer.getBlockFromHeight(
                parseInt(req.query.from),
                req.query.sortBy,
                parseInt(req.query.limit),
                parseInt(req.query.offset)
            );
        } else if (req.query.to) {
            blocks = await blockExplorer.getBlockToHeight(
                parseInt(req.query.to),
                req.query.sortBy,
                parseInt(req.query.limit),
                parseInt(req.query.offset)
            );
        }
        if (blocks === null) {
            throw new Error("block not found");
        }
        return res.status(200).send(blocks);
    } catch (error) {
        logger.error(error.message);
        return res.status(400).send(error);
    }
};

const getBlocks = async (req, res) => {
    logger.info("getBlocks");
    if (!req.query.sortBy) {
        req.query.sortBy = 'ASC';
    }
    if (!req.query.limit) {
        req.query.limit = 20;
    }
    if (!req.query.offset) {
        req.query.offset = 0;
    }
    try {
        const blocks = await blockExplorer.getBlocks(
            parseInt(req.query.limit),
            parseInt(req.query.offset),
            req.query.sortBy
        );
        if (blocks === null) {
            throw new Error("block not found");
        }
        return res.status(200).send(blocks);
    } catch (error) {
        logger.error(error.message);
        return res.status(400).send(error);
    }
};

const getBlocksByTime = async (req, res) => {
    logger.info("getBlocksByTime");
    let blocks;
    if ((!req.query.from && !req.query.to)) {
        return res
            .status(400)
            .send({ msg: i18n.__('Error. "from/to" any one is required parameter') });
    }
    if ((req.query.from && req.query.to)) {
        return res
            .status(400)
            .send({ msg: i18n.__('Error. either from or to is required parameter') });
    }

    if (!req.query.sortBy) {
        req.query.sortBy = 'ASC';
    }
    if (!req.query.limit) {
        req.query.limit = 20;
    }
    if (!req.query.offset) {
        req.query.offset = 0;
    }
    try {
        if (req.query.from) {
            blocks = await blockExplorer.getBlockFromTime(
                req.query.from,
                req.query.sortBy,
                parseInt(req.query.limit),
                parseInt(req.query.offset)
            );
        } else if (req.query.to) {
            blocks = await blockExplorer.getBlockToTime(
                req.query.to,
                req.query.sortBy,
                parseInt(req.query.limit),
                parseInt(req.query.offset)
            );
        }
        if (blocks === null) {
            throw new Error("block not found");
        }
        return res.status(200).send(blocks);
    } catch (error) {
        logger.error(error.message);
        return res.status(400).send(error);
    }
};

const getTransactions = async (req, res) => {
    logger.info("getTransactions");

    if (!req.query.sortBy) {
        req.query.sortBy = 'ASC';
    }
    if (!req.query.limit) {
        req.query.limit = 20;
    }
    if (!req.query.offset) {
        req.query.offset = 0;
    }
    try {
        const txs = await blockExplorer.getTransactions(
            parseInt(req.query.limit),
            parseInt(req.query.offset),
            req.query.sortBy
        );
        if (txs === null) {
            throw new Error("transactions not found");
        }
        return res.status(200).send(txs);
    } catch (error) {
        logger.error(error.message);
        return res.status(400).send(error);
    }
};

const getTxByHash = async (req, res) => {
    logger.info("getTxByHash");

    if (!req.params.txHash) {
        return res
            .status(400)
            .send({ msg: i18n.__('Error. "hash" is a required parameter') });
    }
    try {
        const tx = await blockExplorer.getTxbyHash(
            req.params.txHash,
        );
        if (tx === null) {
            throw new Error("tx not found");
        }
        return res.status(200).send(tx);
    } catch (error) {
        logger.error(error.message);
        return res.status(400).send(error);
    }
};

const getTxsByTime = async (req, res) => {
    logger.info("getTxsByTime");
    let txs;

    if ((!req.query.from && !req.query.to)) {
        return res
            .status(400)
            .send({ msg: i18n.__('Error. "from/to" any one is required parameter') });
    }
    if ((req.query.from && req.query.to)) {
        return res
            .status(400)
            .send({ msg: i18n.__('Error. either from or to is required parameter') });
    }

    if (!req.query.sortBy) {
        req.query.sortBy = 'ASC';
    }
    if (!req.query.limit) {
        req.query.limit = 20;
    }
    if (!req.query.offset) {
        req.query.offset = 0;
    }

    try {
        if (req.query.from) {
            txs = await blockExplorer.getTxFromTime(
                req.query.from,
                req.query.sortBy,
                parseInt(req.query.limit),
                parseInt(req.query.offset)
            );
        } else if (req.query.to) {
            txs = await blockExplorer.getTxToTime(
                req.query.to,
                req.query.sortBy,
                parseInt(req.query.limit),
                parseInt(req.query.offset)
            );
        }
        if (txs === null) {
            throw new Error("tx not found");
        }
        return res.status(200).send(txs);
    } catch (error) {
        logger.error(error.message);
        return res.status(400).send(error);
    }
};


// assets part is under implementation
const getAssets = async (req, res) => {
    logger.info("getAssets");

    if (!req.query.sortBy) {
        req.query.sortBy = 'ASC';
    }
    if (!req.query.limit) {
        req.query.limit = 20;
    }
    if (!req.query.offset) {
        req.query.offset = 0;
    }
    try {
        const assets = await blockExplorer.getAssets(
            parseInt(req.query.limit),
            parseInt(req.query.offset),
            req.query.sortBy
        );
        if (assets === null) {
            throw new Error("assets not found");
        }
        return res.status(200).send(assets);
    } catch (error) {
        logger.error(error.message);
        return res.status(400).send(error);
    }
};
const getAssetByTxId = async (req, res) => {
    logger.info("getAssetByTxId");

    if (!req.params.txId) {
        return res
            .status(400)
            .send({ msg: i18n.__('Error. "txId" is a required parameter') });
    }
    try {
        const asset = await blockExplorer.getAssetbytxId(
            req.params.txId,
        );
        if (asset === null) {
            throw new Error("asset not found");
        }
        return res.status(200).send(asset);
    } catch (error) {
        logger.error(error.message);
        return res.status(400).send(error);
    }
};

const getAssetsByTime = async (req, res) => {
    logger.info("getAssetsByTime");
    let assets;

    if ((!req.query.from && !req.query.to)) {
        return res
            .status(400)
            .send({ msg: i18n.__('Error. "from/to" any one is required parameter') });
    }
    if ((req.query.from && req.query.to)) {
        return res
            .status(400)
            .send({ msg: i18n.__('Error. either from or to is required parameter') });
    }

    if (!req.query.sortBy) {
        req.query.sortBy = 'ASC';
    }
    if (!req.query.limit) {
        req.query.limit = 20;
    }
    if (!req.query.offset) {
        req.query.offset = 0;
    }

    try {
        if (req.query.from) {
            assets = await blockExplorer.getAssetFromTime(
                req.query.from,
                req.query.sortBy,
                parseInt(req.query.limit),
                parseInt(req.query.offset)
            );
        } else if (req.query.to) {
            assets = await blockExplorer.getAssetToTime(
                req.query.to,
                req.query.sortBy,
                parseInt(req.query.limit),
                parseInt(req.query.offset)
            );
        }
        if (assets === null) {
            throw new Error("assets not found");
        }
        return res.status(200).send(assets);
    } catch (error) {
        logger.error(error.message);
        return res.status(400).send(error);
    }
};

const getNumberOfTxs = async (req, res) => {
    logger.info("getNumberOfTxs");
    try {
        const txs = await blockExplorer.getNumberOfTxs();
        return res.status(200).send(txs);
    } catch (error) {
        logger.error(error.message);
        return res.status(400).send(error);
    }
};

const getNumberOfBlocks = async (req, res) => {
    logger.info("getNumberOfBlocks");
    try {
        const blocks = await blockExplorer.getNumberOfBlocks();
        return res.status(200).send(blocks);
    } catch (error) {
        logger.error(error.message);
        return res.status(400).send(error);
    }
};

/**
 * Get list of peer nodes
 * @param {*} req 
 * @param {*} res 
 */
const getListOfNodes = async (req, res) => {
    logger.info("getListOfNodes");
    try {
        const listOfNodes = await blockExplorer.getListOfNodes();
        return res.status(200).send(listOfNodes);
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

    /**
     * Get block by block hash
     *
     * @name Get block by block hash
     * @route {GET} /${namespace}/blocks/hash/:blockHash
     * @queryparam {String} hash hash of a block
     * @queryparam {boolean} includeTxData true or false depends if whole tx needed
     * @authentication Requires application authentication
     */
    server.get(
        `/${namespace}/blocks/hash/:blockHash`,
        routeValidation(server.ensureApplication(plugin)),
        getBlockByHash
    );


    /**
     * Get block by block height
     *
     * @name Get block by block height
     * @route {GET} /${namespace}/blocks/height/:blockHeight
     * @queryparam {number} height height of a block
     * @queryparam {boolean} includeTxData true or false depends if whole tx needed
     * @authentication Requires application authentication
     */
    server.get(
        `/${namespace}/blocks/height/:blockHeight`,
        routeValidation(server.ensureApplication(plugin)),
        getBlockByHeight
    );

    /**
     * Get all blocks between range of heights
     *
     * @name Get all blocks between range of heights
     * @route {GET} /${namespace}/blocks/heights
     * @queryparam {number} from minimun height of a block
     * @queryparam {number} to maximum height of a block
     * @authentication Requires application authentication
     */
    server.get(
        `/${namespace}/blocks/heights`,
        routeValidation(server.ensureApplication(plugin)),
        getBlocksWithinHeight
    );

    /**
     * Get all blocks with a limit
     *
     * @name Get all blocks within a limit
     * @route {GET} /${namespace}/blocks
     * @queryparam {number} limit number of blocks
     * @queryparam {number} offset number of page
     * @authentication Requires application authentication
     */
    server.get(
        `/${namespace}/blocks`,
        routeValidation(server.ensureApplication(plugin)),
        getBlocks
    );

    /**
     * Get all blocks between range of time
     *
     * @name Get all blocks between range of time
     * @route {GET} /${namespace}/blocks/time
     * @queryparam {number|string} from start time of a block
     * @queryparam {number|string} to end time of a block
     * @authentication Requires application authentication
     */
    server.get(
        `/${namespace}/blocks/time`,
        routeValidation(server.ensureApplication(plugin)),
        getBlocksByTime
    );

    /**
     * Get all transactions with a limit
     *
     * @name Get all transactions within a limit
     * @route {GET} /${namespace}/transactions
     * @queryparam {number} limit number of transactions
     * @queryparam {number} offset number of page
     * @authentication Requires application authentication
     */
    server.get(
        `/${namespace}/transactions`,
        routeValidation(server.ensureApplication(plugin)),
        getTransactions
    );

    /**
     * Get transaction by hash
     *
     * @name Get transaction by hash
     * @route {GET} /${namespace}/transactions/hash/:txHash
     * @queryparam {String} hash hash of a tx
     * @authentication Requires application authentication
     */
    server.get(
        `/${namespace}/transactions/hash/:txHash`,
        routeValidation(server.ensureApplication(plugin)),
        getTxByHash
    );

    /**
     * Get all transactions between range of time
     *
     * @name Get all transactions between range of time
     * @route {GET} /${namespace}/transactions/time
     * @queryparam {number|string} from start time
     * @queryparam {number|string} to end time
     * @authentication Requires application authentication
     */
    server.get(
        `/${namespace}/transactions/time`,
        routeValidation(server.ensureApplication(plugin)),
        getTxsByTime
    );

    /**
    * Get all assets with a limit
    *
    * @name Get all transactions within a limit
    * @route {GET} /${namespace}/assets
    * @queryparam {number} limit number of assets
    * @queryparam {number} offset number of page
    * @authentication Requires application authentication
    */
    server.get(
        `/${namespace}/assets`,
        routeValidation(server.ensureApplication(plugin)),
        getAssets
    );

    /**
    * Get asset by txId
    *
    * @name Get asset by txId
    * @route {GET} /${namespace}/assets/hash/:txId
    * @queryparam {String} hash txId of an asset
    * @authentication Requires application authentication
    */
    server.get(
        `/${namespace}/assets/hash/:txId`,
        routeValidation(server.ensureApplication(plugin)),
        getAssetByTxId
    );

    /**
     * Get all assets between range of time
     *
     * @name Get all assets between range of time
     * @route {GET} /${namespace}/assets/time
     * @queryparam {number|string} from start time
     * @queryparam {number|string} to end time
     * @authentication Requires application authentication
     */
    server.get(
        `/${namespace}/assets/time`,
        routeValidation(server.ensureApplication(plugin)),
        getAssetsByTime
    );

    /**
     * Get total number of txs
     *
     * @name Get total number of txs
     * @route {GET} /${namespace}/transactions/count
     * @authentication Requires application authentication
     */
    server.get(
        `/${namespace}/transactions/count`,
        routeValidation(server.ensureApplication(plugin)),
        getNumberOfTxs
    );

    /**
     * Get total number of blocks
     *
     * @name Get total number of blocks
     * @route {GET} /${namespace}/blocks/count
     * @authentication Requires application authentication
     */
    server.get(
        `/${namespace}/blocks/count`,
        routeValidation(server.ensureApplication(plugin)),
        getNumberOfBlocks
    );

     /**
     * Get information about the nodes
     *
     * @name Get a list of nodes
     * @route {GET} /${namespace}/chain/nodes
     * @authentication Requires application authentication
     */
    server.get(
        `/${namespace}/chain/nodes`,
        routeValidation(server.ensureApplication(plugin)),
        getListOfNodes
    );
};
const deactivate = {
    route1: {
        path: "/ng-rt-digitalAsset/blocks/hash/:blockHash",
        type: "get"
    },
    route2: {
        path: "/ng-rt-digitalAsset/blocks/height/:blockHeight",
        type: "get"
    },
    route3: {
        path: "/ng-rt-digitalAsset/blocks/heights",
        type: "get"
    },
    route4: {
        path: "/ng-rt-digitalAsset/blocks",
        type: "get"
    },
    route5: {
        path: "/ng-rt-digitalAsset/blocks/time",
        type: "get"
    },
    route6: {
        path: "/ng-rt-digitalAsset/transactions",
        type: "get"
    },
    route7: {
        path: "/ng-rt-digitalAsset/transactions/hash/:txHash",
        type: "get"
    },
    route8: {
        path: "/ng-rt-digitalAsset/transactions/time",
        type: "get"
    },
    route9: {
        path: "/ng-rt-digitalAsset/assets",
        type: "get"
    },
    route10: {
        path: "/ng-rt-digitalAsset/assets/hash/:txId",
        type: "get"
    },
    route11: {
        path: "/ng-rt-digitalAsset/assets/time",
        type: "get"
    },
    route12: {
        path: "/ng-rt-digitalAsset/transactions/count",
        type: "get"
    },
    route13: {
        path: "/ng-rt-digitalAsset/blocks/count",
        type: "get"
    },
    getListOfNodes: {
        path: "/ng-rt-digitalAsset/chain/nodes",
        type: "get"
    }
};

module.exports = {
    init,
    activate,
    deactivate,
    getBlockByHash,
    getBlockByHeight,
    getBlocksWithinHeight,
    getBlocks,
    getBlocksByTime,
    getTransactions,
    getTxByHash,
    getTxsByTime,
    getAssets,
    getAssetByTxId,
    getAssetsByTime,
    getNumberOfTxs,
    getNumberOfBlocks,
    getListOfNodes
};
