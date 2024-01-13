'use strict';

const logger = require('log4js').getLogger('ng-rt-smartContracts.routes');
const bodyParser = require('body-parser');
/* eslint-disable */

let unconfirmedMemory = [];
let consensus;
let services;
let server;
let i18n;
let smartContractService;
let routeValidation;
let pluginSettings;
let scExplorerService;

let includeNodeName;
let excludeTabName;
const init = (_server, plugin) => {
	server = _server;
	services = global.serviceManager;
	i18n = services.get('i18n');
	pluginSettings = server.plugin_manager.configs.get(plugin);

	routeValidation = (ensure) => {
		return (req, res, next) => {
			let enable = pluginSettings.get('routeValidation');
			if (enable) return ensure(req, res, next);
			else return next();
		};
	};

	delete require.cache[require.resolve('../services/services/smartContract')];
	smartContractService = require('../services/services/smartContract')(services);
	consensus = require('../consensus')(services);
	smartContractService.configure(unconfirmedMemory);
	consensus.configure(unconfirmedMemory);
	delete require.cache[require.resolve('../services/contractExplorer')];
	scExplorerService = require('../services/contractExplorer')(services, pluginSettings);
	includeNodeName = pluginSettings.get('matchNodes');
	excludeTabName = pluginSettings.get('ignoreTab');
};

const publish = async function(req, res) {
	try {
		logger.info('Publish Smart Contract');

		if (!req.body) return res.sendStatus(400);
		const clientSigning = req.body.clientSigning ? JSON.parse(req.body.clientSigning) : '';

		let result = await smartContractService.publish(
			req.params.templateName,
			req.body.args,
			req.body.pubKey,
			clientSigning
		);

		return res.send(result);
	} catch (error) {
		logger.error(error);
		return res.status(400).send({ msg: error.message });
	}
};

const call = async function(req, res) {
	try {
		const args = req.body.args ? JSON.parse(req.body.args) : '';
		const clientSigning = req.body.clientSigning ? JSON.parse(req.body.clientSigning) : '';

		let remoteIp =
			req.headers['x-forwarded-for'] ||
			req.connection.remoteAddress ||
			req.socket.remoteAddress ||
			req.connection.socket.remoteAddress;

		logger.info('Call Smart Contract');
		logger.info('function: ', req.params.functionName);
		logger.info('body: ', req.body);
		logger.info('args: ', args);
		logger.info('remoteIp: ', remoteIp);

		const result = await smartContractService.call(
			req.params.contractId,
			req.params.functionName,
			args,
			req.body.pubKey,
			clientSigning,
			remoteIp
		);

		logger.info('call finished.');
		return res.send(result);
	} catch (error) {
		logger.error(error);
		return res.status(400).send({ msg: error.message });
	}
};

const transfer = async function(req, res) {
	try {
		logger.info('Transfer Call Smart Contract');
		logger.info('address: ', req.params.contractId);
		logger.info('function: ', req.params.functionName);
		logger.info('args: ', req.body.args);
		logger.info('assetId: ', req.body.assetId);
		logger.info('pubKey: ', req.body.pubKey);
		logger.info('clientSigning: ', req.body.clientSigning);
		logger.info('nextOwner: ', req.body.nextOwner);
		logger.info('amount: ', req.body.amount);
		logger.info('latestTxId: ', req.body.latestTxId);

		let remoteIp =
			req.headers['x-forwarded-for'] ||
			req.connection.remoteAddress ||
			req.socket.remoteAddress ||
			req.connection.socket.remoteAddress;

		let output;
		const clientSigning = req.body.clientSigning ? JSON.parse(req.body.clientSigning) : '';

		if (req.body.output) {
			output = req.body.output;
		} else {
			output = 0;
		}

		logger.info('output', output);

		if (req.body.nextOwner === 'false') {
			req.body.nextOwner = false;
		}

		let data = {
			contractId: req.params.contractId,
			functionName: req.params.functionName,
			args: req.body.args,
			assetId: req.body.assetId,
			assetPubKey: req.body.pubKey,
			clientSigning: clientSigning,
			remoteIp,
			nextOwner: req.body.nextOwner,
			amount: req.body.amount,
			output,
			latestTxId: req.body.latestTxId
		};

		const result = await smartContractService.transferCall(data);
		logger.info('transferCall finished.');

		return res.send(result);
	} catch (error) {
		logger.error(error.message);
		return res.status(400).send({msg: error.message});
	}
};

const checkTx = async function(req, res) {
	let result = await consensus.checkTx(req.body.data);
	res.send(result);
};

const deliverTx = async function(req, res) {
	let result = await consensus.deliverTx(req.body.data);
	res.send(result);
};

const contractInstanceDetailsById = async (req, res) => {
	try {
		const contractId = req.params.contractId;
		const contractInstanceDetails = await scExplorerService.contractInstanceDetailsById(contractId);
		res.status(200).send(contractInstanceDetails);
	} catch (error) {
		logger.error(error.message);
		res.status(400).send(error);
	}
};

const contractStatebyId = async (req, res) => {
	try {
		const contractId = req.params.contractId;
		const contractState = await scExplorerService.contractStateById(contractId);
		res.status(200).send(contractState);
	} catch (error) {
		logger.error(error.message);
		res.status(400).send(error);
	}
};

/**
 * Fetches a list of currently deployed smart contract templates
 * @param {*} req
 * @param {*} res
 */
const contractTemplates = (req, res) => {
	try {
		const deployedTemplates = scExplorerService.getContractTemplates({ excludeTabName, includeNodeName });
		res.status(200).json(deployedTemplates);
	} catch (error) {
		logger.error(error.message);
		res.status(400).send(error);
	}
};

const contractTemplateDetails = (req, res) => {
	try {
		const templateName = req.params.templateName;
		const version = req.query.version ? req.query.version : '1.0';
		const templateDetails = scExplorerService.getContractTemplateDetails(templateName, version, {
			includeNodeName,
			excludeTabName
		});
		res.status(200).json(templateDetails);
	} catch (error) {
		logger.error(error.message);
		res.status(400).send('Unable to fetch contract template details');
	}
};

const getPublicPluginConfiguration = async (req, res) => {
	logger.info('Get info');
	try {
		const info = await smartContractService.getPublicPluginConfiguration(pluginSettings);
		return res.status(200).send(info);
	} catch (error) {
		logger.error(error.message);
		return res.status(400).send(error);
	}
};

const contractInstanceByTemplateName = async (req, res) => {
	try {
		const templateName = req.params.templateName;
		const instances = await scExplorerService.contractInstanceByTemplateName(templateName);
		res.status(200).json(instances);
	} catch (error) {
		logger.error(error.message);
		res.status(400).send(error);
	}
};

const contractInstances = async (req, res) => {
	try {
		if (!req.query.sortBy) {
			req.query.sortBy = 'ASC';
		}
		if (!req.query.limit) {
			req.query.limit = 20;
		}
		if (!req.query.offset) {
			req.query.offset = 0;
		}

		let contractId = req.query.contractId ? req.query.contractId : '';
		let owner = req.query.owner ? req.query.owner : '';
		let createdOn = req.query.createdOn ? req.query.createdOn : '';

		const instances = await scExplorerService.fetchAllContractInstances(
			parseInt(req.query.limit),
			parseInt(req.query.offset),
			req.query.sortBy,
			{ contractId, owner, createdOn }
		);
		res.status(200).json(instances);
	} catch (error) {
		logger.error(error.message);
		res.status(400).send(error);
	}
};

const getUserInformationByPublicKey = async (req, res) => {
	try {
		const publicKey = req.params.publicKey;
		const userInfo = await scExplorerService.getUserInformationByPublicKey(publicKey);
		res.status(200).json(userInfo);
	} catch (error) {
		logger.error(error.message);
		res.status(400).send(error);
	}
};

/**
 * API/Route/ng-rt-smartContracts
 *
 * @module API/Route/ng-rt-smartContracts
 * @type {Object}
 */
const activate = (server, plugin, pluginInstance) => {
	init(server, plugin);
	//server.use(bodyParser.json()); // for parsing application/json
	server.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
	logger.debug(i18n.__('Plugin name :'), pluginInstance.name);
	logger.debug(i18n.__(`${pluginInstance.name} routes init`));
	/**
   * Publish by application key
   * @name Publish
   * @description Publish smart contract instance
   * @route {POST} /ng-rt-smartContracts/contracts/app/:templateName
   * @routeparam {string} templateName Specify the smart contract template you would like to publish (required parameter)
   * @bodyparam {string} pubKey Client public key (required parameter)
   * @bodyparam {string} args enter a desired value (required parameter)
   *             Value: (arg1@arg2@...@argN)
   * @bodyparam {Boolean} clientSigning specifies where signing of the transaction will take place (required parameter)
   *             Values: (clientSigning|true or false) <br>
   *             <ul>
   *             <li>true - client will sign the transaction</li>
   *             <li>false - server will sign the transaction</li>
   *             </ul>
   * @authentication Requires application authentication via JWT token
   * @returnparam {object} Tx Signed or Unsigned transaction of the created smart contract instance
   */

	server.post(
		`/ng-rt-smartContracts/contracts/app/:templateName`,
		routeValidation(server.ensureApplication(plugin)),
		publish
	);

	/**
   *
   * @ignore @name Publish
   * @ignore @description Publish smart contract instance
   * @ignore @route {POST} /ng-rt-smartContracts/contracts/:templateName
   * @ignore @routeparam {string} templateName Smart contract template name - required
   * @ignore @bodyparam {string} pubKey Client public key - required
   * @ignore @bodyparam {string} args Initial args - required <br>
   *             Value: (arg1@arg2@...@argN)
   * @ignore @bodyparam {Boolean} clientSigning clientSigning - required <br>
   *             Values: (clientSigning|true or false) <br>
   *             <ul>
   *             <li>true - Is used to sign on client side</li>
   *             <li>false - Is used to sign on server side</li>
   *             </ul>
   * @ignore @authentication Requires user authentication
   * @ignore @returnparam {object} Tx Signed or Usigned transaction of the created smart contract instance
   */

	server.post(`/ng-rt-smartContracts/contracts/:templateName`, server.checkUserLogin(), publish);

	/**
   * Call by application key
   * @name Call
   * @description Call method to read or update the smart contract memory
   * @route {POST} /ng-rt-smartContracts/contracts/app/call/:contractId/:functionName
   * @routeparam {string} contractId ID of smart contract (required parameter)
   * @routeparam {string} functionName Method of smart contract (required parameter)
   * @bodyparam {string} pubKey to update the memory, enter the client public key (required parameter)
   * @bodyparam {string} args to update the memory, enter a desired value (required parameter)
   *             Value: (arg1@arg2@...@argN)
   * @bodyparam {Boolean} clientSigning to update the memory, specifies where signing of the transaction will take place (required parameter)
   *             Values: (clientSigning|true or false) <br>
   *             <ul>
   *             <li>true - client will sign the transaction</li>
   *             <li>false - server will sign the transaction</li>
   *             </ul>
   * @authentication Requires application authentication via JWT token
   * @returnparam {object} Result Returns the smart contract memory object
   */

	server.post(
		`/ng-rt-smartContracts/contracts/app/call/:contractId/:functionName`,
		routeValidation(server.ensureApplication(plugin)),
		call
	);

	/**
   *
   * @ignore @name Call
   * @ignore @description Call method to read or update the smart contract memory
   * @ignore @route {POST} /ng-rt-smartContracts/contracts/call/:contractId/:functionName
   * @ignore @routeparam {string} contractId ID of smart contract - required
   * @ignore @routeparam {string} functionName Method of smart contract - required
   * @ignore @bodyparam {string} pubKey Client public key - required
   * @ignore @bodyparam {string} args Args - required <br>
   *             Value: (arg1@arg2@...@argN)
   * @ignore @bodyparam {Boolean} clientSigning clientSigning - required <br>
   *             Values: (clientSigning|true or false) <br>
   *             <ul>
   *             <li>"true" - Is used to sign on client side</li>
   *             <li>"false" - Is used to sign on server side</li>
   *             </ul>
   * @ignore @authentication Requires user authentication
   * @ignore @returnparam {object} Result Returns the smart contract memory object
   */

	server.post(`/ng-rt-smartContracts/contracts/call/:contractId/:functionName`, server.checkUserLogin(), call);

	/**
   * Transfer by application key
   * @name TransferCall
   * @description Transfers the digital asset between two parties or to the smart contract
   * @route {POST} /ng-rt-smartContracts/contracts/app/transferCall/:contractId/:functionName
   * @routeparam {string} contractId ID of smart contract (required parameter)
   * @routeparam {string} functionName Method of smart contract (required parameter)
   * @bodyparam {string} pubKey enter the client public key (required parameter)
   * @bodyparam {string} args to update the memory, enter a desired value (required parameter)
   *     Value: (arg1@arg2@...@argN)
   * @bodyparam {Boolean} clientSigning to update the memory, specifies where signing of the transaction will take place (required parameter)
   *             Values: (clientSigning|true or false) <br>
   *             <ul>
   *             <li>true - client will sign the transaction</li>
   *             <li>false - server will sign the transaction</li>
   * @bodyparam {string} pubKey Public key of asset's current owner (required parameter)
   * @bodyparam {string} assetId ID of digital asset to be transferred (required parameter)
   * @bodyparam {string} nextOwner public key of the recipient
   * @bodyparam {string} latestTxId specify the latest transaction ID in this smart contract
   * @authentication Requires application authentication via JWT token
   * @returnparam {object} Result Returns the transaction
   */

	server.post(
		`/ng-rt-smartContracts/contracts/app/transferCall/:contractId/:functionName`,
		routeValidation(server.ensureApplication(plugin)),
		transfer
	);

	/**
   *
   * @ignore @name TransferCall
   * @ignore @description TransferCall method transfers the digital asset between two parties or to the smart contract
   * @ignore @route {POST} /ng-rt-smartContracts/contracts/transferCall/:contractId/:functionName
   * @ignore @routeparam {string} contractId ID of smart contract - required
   * @ignore @routeparam {string} functionName transfer Method of smart contract - required
   * @ignore @bodyparam {string} pubKey Public key of asset's owner - required
   * @ignore @bodyparam {string} args Args - required <br>
   * @ignore @bodyparam {string} assetId ID of digital asset - required
   * @ignore @bodyparam {Boolean} clientSigning clientSigning - required <br>
   *             Values: (clientSigning|true or false) <br>
   *             <ul>
   *             <li>true - Is used to sign on client side</li>
   *             <li>false - Is used to sign on server side</li>
   *             </ul>
   * @ignore @bodyparam {string} nextOwner Public key of asset's next owner  <br>
   * @ignore @authentication Requires user authentication
   * @ignore @returnparam {object} Result Returns the transaction
   */

	server.post(
		`/ng-rt-smartContracts/contracts/transferCall/:contractId/:functionName`,
		server.checkUserLogin(),
		transfer
	);
	/**
   * @name checkTx
   * @route {POST} /ng-rt-smartContracts/consensus/checkTx
   * @authentication None
   * @returnparam {object} Result Returns the Allow | Fail | Next
   * @ignore
   */

	server.post('/ng-rt-smartContracts/consensus/checkTx', checkTx);

	/**
   * @name deliverTx
   * @route {POST} /ng-rt-smartContracts/consensus/deliverTx
   * @authentication None
   * @returnparam {object} Result Returns the Allow | Fail
   * @ignore
   */

	server.post('/ng-rt-smartContracts/consensus/deliverTx', deliverTx);

	/**
   * @name contractTemplates
   * @route {GET} /ng-rt-smartContracts/contract-templates
   * @description Fetches a list of currently deployed Node-RED templates
   */
	server.get('/ng-rt-smartContracts/contract-templates', contractTemplates);

	/**
   * @name contractTemplateDetails
   * @route {GET} /ng-rt-smartContracts/contract-templates/:templateName
   * @routeparam {string} templateName Specify the desired smart contract template
   * @description Fetches associated functions and arguments for a given template name
   */
	server.get('/ng-rt-smartContracts/contract-templates/:templateName', contractTemplateDetails);

	/**
   * @name contractInstanceDetailsById
   * @route {GET} /ng-rt-smartContracts/contracts/:contractId
   * @routeparam {string} contractId Specify the ID of the desired published smart contract
   * @description Fetches contract function and arguments by contractId
   */
	server.get('/ng-rt-smartContracts/contracts/:contractId', contractInstanceDetailsById);

	/**
   * @name contractStatebyId
   * @route {GET} /ng-rt-smartContracts/contracts/:contractId/state
   * @routeparam {string} contractId Specify the ID of the desired published smart contract
   * @description Fetches the state/memory of a contract by contractId
   */
	server.get('/ng-rt-smartContracts/contracts/:contractId/state', contractStatebyId);

	/**
   * Get public values for the plugin
   * @name Get Get public values for the plugin
   * @route {GET} /ng-rt-smartContracts/config
   */
	server.get(`/ng-rt-smartContracts/config`, getPublicPluginConfiguration);

	/**
   * @name contractInstanceByTemplateName
   * @route {GET} /ng-rt-smartContracts/contracts/:templateName/instances
   * @routeparam {string} templateName Specify the name of the desired published smart contract
   * @description Fetches the instances of the give templateName
   */
	server.get('/ng-rt-smartContracts/contracts/:templateName/instances', contractInstanceByTemplateName);

	/**
   * @name contractInstances
   * @route {GET} /ng-rt-smartContracts/contracts
   * @queryparam {number} limit number of blocks
   * @queryparam {number} offset number of page
   * @queryparam {string} sortBy ASC|DESC
   * @description Fetches all the instances of published contracts
   */
	server.get('/ng-rt-smartContracts/contracts', contractInstances);

	/**
	 * @name getUserInformationByPublicKey
	 * @route {GET} /ng-rt-smartContracts/getUserInformationByPublicKey
	 * @description Fetch user information by publicKey(TBSP/External/Unknown)
	 */
	server.get('/ng-rt-smartContracts/getUserInformationByPublicKey/:publicKey', getUserInformationByPublicKey);
};

const deactivate = {
	route: {
		path: '/ng-rt-smartContracts/publish',
		type: 'post'
	},
	route1: {
		path: '/ng-rt-smartContracts/call',
		type: 'post'
	},
	route2: {
		path: '/ng-rt-smartContracts/transfer',
		type: 'post'
	},
	route3: {
		path: '/ng-rt-smartContracts/checkTx',
		type: 'post'
	},
	route4: {
		path: '/ng-rt-smartContracts/deliverTx',
		type: 'post'
	},
	route5: {
		path: '/ng-rt-smartContracts/config',
		type: 'get'
	},
	contractTemplates: {
		path: '/ng-rt-smartContracts/contract-templates/',
		type: 'get'
	},
	contractTemplateDetails: {
		path: '/ng-rt-smartContracts/contract-templates/:templateName',
		type: 'get'
	},
	contractInstanceDetailsById: {
		path: '/ng-rt-smartContracts/contracts/:contractId',
		type: 'get'
	},
	contractStatebyId: {
		path: '/ng-rt-smartContracts/contracts/:contractId/state',
		type: 'get'
	},
	contractInstanceByTemplateName: {
		path: '/ng-rt-smartContracts/contracts/:templateName/instances',
		type: 'get'
	},
	contractInstances: {
		path: '/ng-rt-smartContracts/contracts',
		type: 'get'
	},
	getUserInformationByPublicKey: {
		path: '/ng-rt-smartContracts/getUserInformationByPublicKey/:publicKey',
		type: 'get'
	}
};

module.exports = {
	init,
	activate,
	deactivate,
	publish,
	call,
	transfer,
	checkTx,
	deliverTx,
	getPublicPluginConfiguration
};
