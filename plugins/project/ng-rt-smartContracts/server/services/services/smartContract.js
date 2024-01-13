'use strict';

const logger = require('log4js').getLogger('ng-rt-smartContracts.service.smartContract');
const {digitalAssetDriver} = require('ng-rt-digitalAsset-sdk');
const driver = require('ng-rt-digitalasset-driver')(logger);
const http = require('http');
const request = require('request-promise');
const crypto = require('crypto');

let unconfirmedMemory;
let projectBlockchain;
let redService; // for rewire variable in unit-tests
let keyPairService;
let digitalAssetService;

const executionFlowId = '79418cb8.7e9123';

let configService;
let loopbackApp;

/**
 * Function to configure a module
 * @param {object} __unconfirmedMemory __unconfirmedMemory
 * @ignore
 */

const configure = function(__unconfirmedMemory) {
  unconfirmedMemory = __unconfirmedMemory;
};

/**
 * Function to create a contract
 * @param {object} contractData the contract information
 * @param {string} pubKey pubKey
 * @param {Boolean} clientSigning clientSigning
 * @return {Object} the new transaction
 */
async function create(contractData, pubKey, clientSigning) {
  try {
    let data = {
      contractCreation: {
        source: JSON.stringify(contractData.source),
        memory: contractData.memory,
        sourceHash: contractData.sourceHash,
        hashRandomizer: Math.random().toString(36).substring(7) // contracts with the same initial args will not be created without this field, because they will have the same hash and ID.
      }
    };

    if (clientSigning === true) {
      let tx = await digitalAssetDriver.composeDigitalAssetCreateTx(data, '1', {}, pubKey);
      logger.info('send unsigned Tx');
      return tx;
    }
    let keyPair = keyPairService.resolveKeyPair('', 'system');
    const ownerKeyPair = {
      privateKey: undefined,
      publicKey: pubKey
    };
    const ASSET_FORMAT = driver.getSdkInfo();
    const signedTx = driver.composeAndSignCreateTx(data, '1', {}, pubKey, keyPair.privateKey);
    const tx = await digitalAssetService.createAsset(
			ownerKeyPair,
			signedTx,
			'1',
			{},
			true,
			{domainId: 'd01'},
			'smartContract',
			ASSET_FORMAT,
			'Commit'
		);

    logger.info('send signed Tx Id');
    return tx;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
}

/**
 * Function to update a contract
 * @param {object} update contractUpdate data
 * @param {string} pubKey pubKey
 * @param {string} clientSigning clientSigning
 * @return {Object} new transaction with updates
 */
async function updateCall(update, pubKey, clientSigning) {
  try {
    let data = {
      contractUpdate: {
        address: update.contractId,
        functionName: update.functionName,
        args: update.args,
        memory: update.memory,
        previousCallId: update.previousCallId
      }
    };

    if (clientSigning === true) {
      let tx = await digitalAssetDriver.composeDigitalAssetCreateTx(data, '1', {}, pubKey);
      logger.info('send unsigned Tx');
      return tx;
    }
    let keyPair = keyPairService.resolveKeyPair('', 'system');
    const ownerKeyPair = {
      privateKey: undefined,
      publicKey: pubKey
    };
    const ASSET_FORMAT = driver.getSdkInfo();
    const signedTx = driver.composeAndSignCreateTx(data, '1', {}, pubKey, keyPair.privateKey);
    const tx = await digitalAssetService.createAsset(
			ownerKeyPair,
			signedTx,
			'1',
			{},
			true,
			{domainId: 'd01'},
			'smartContract',
			ASSET_FORMAT,
			'Commit'
		);

    logger.info('send signed Tx Id');
    return tx;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
}
/* eslint-disable */
/**
 * Gets a transaction by id
 * @param {string} txId the id of the transaction
 * @return {Object} returns transaction
 */
const getTx = async function(txId) {
	try {
		let tx = await projectBlockchain.getTxById(txId);
		if (!tx) {
			// return false;
			throw new Error('Transaction not found for txId: ' + txId);
		}

		return tx.txData; // tx.txData
	} catch (error) {
		logger.error(error.message);
		// return false;
		throw error;
	}
};

/**
 * Function to transfer a contract
 * @param {object} update Update data
 * @param {string} assetPubKey pubKey
 * @param {Boolean} clientSigning clientSigning
 * @param {string} nextOwnerPubKey pubKey
 * @param {number} amount amount to transfer
 * @param {string} latestTxId of the latest Tx Id
 * @param {amount} outputIndex ID of the output
 * @return {transaction} return transaction 
 */
async function updateTransfer(update, assetPubKey, clientSigning, nextOwnerPubKey, amount, latestTxId, outputIndex) {
	try {
		let scKeys = keyPairService.resolveKeyPair('', 'smartContract');

		if (update.memory && update.memory['']) {
			delete update.memory[''];
		}

		if (assetPubKey == 'false') assetPubKey = false;
		if ((assetPubKey === 'false' || assetPubKey == false) && clientSigning === false) {
			assetPubKey = scKeys.publicKey;
		} else if ((assetPubKey === 'false' || assetPubKey == false) && clientSigning === true) {
			assetPubKey = scKeys.publicKey;
		}
		if (!assetPubKey) throw new Error('no assetPubKey');

		let metadata = {};

		if (update.changeAsset && update.changeAsset.type) {
			metadata = {
				type: update.changeAsset.type
			};
			delete update.changeAsset.type;
		}
		// take the latest transaction
		const sourceTx = await getTx(latestTxId);

		if (!sourceTx) throw new Error('no such source tx');

		const unspent = sourceTx.outputs[outputIndex];

		if (!unspent) throw new Error('no such output in source tx');

		unspent.amount = parseInt(unspent.amount, 10);
		amount = parseInt(amount, 10);
		let outputs;
		if (amount < unspent.amount) {
			let change = unspent.amount - amount;
			let changeAddress = unspent.public_keys[0];
			if (!nextOwnerPubKey) {
				outputs = [
					digitalAssetDriver.makeOutput(changeAddress, String(change)),
					digitalAssetDriver.makeOutput(scKeys.publicKey, String(amount))
				];
			} else {
				outputs = [
					digitalAssetDriver.makeOutput(changeAddress, String(change)),
					digitalAssetDriver.makeOutput(nextOwnerPubKey, String(amount))
				];
			}
			metadata.lockedOnContract = update.address ? update.address : update.contractId;
			metadata.outputId = 0;
		} else if (!nextOwnerPubKey) {
			// eslint-disable-line
			outputs = [ digitalAssetDriver.makeOutput(scKeys.publicKey, String(amount)) ];
			metadata.lockedOnContract = update.address ? update.address : update.contractId;
			metadata.outputId = 0;
		} else {
			outputs = [ digitalAssetDriver.makeOutput(nextOwnerPubKey, String(amount)) ];
		}

		metadata.contractUpdate = {
			eventType: 'contractUpdate',
			address: update.contractId,
			functionName: update.functionName,
			args: update.args,
			memory: update.memory
		};

		for (let index = 0; index < sourceTx.outputs.length; index++) {
			const element = sourceTx.outputs[index];
			if (element.public_keys.includes(scKeys.publicKey)) {
				const ASSET_FORMAT = driver.getSdkInfo();
				const signedTx = driver.composeAndSignTransferTx(
					[ { tx: sourceTx, output_index: index } ],
					metadata,
					outputs,
					scKeys.privateKey
				);
				const transferDaResponse = await digitalAssetService.transferAsset(
					scKeys,
					nextOwnerPubKey,
					signedTx,
					metadata,
					true,
					{ domainId: 'd01' },
					'smartContract',
					ASSET_FORMAT,
					'Commit'
				);
				return transferDaResponse;
			}
		}
		const unsignedTx = await digitalAssetDriver.composeTransferTx(
			[ { tx: sourceTx, output_index: outputIndex } ],
			metadata,
			outputs
		);
		return unsignedTx;
	} catch (error) {
		logger.error(error);
		throw error;
	}
}

/**
 * Function to getMemory of a contract
 * @param {objects} models set of references to DB models
 * @param {string} contractId ID of the contract
 * @return {Object} Memory of the contract
 */
async function getMemory(models, contractId) {
	try {
		let items = await models.worldState.find({ where: { contractId: contractId } });

		if (!items || items.length == 0) {
			throw Error('No such contract in the World State');
		}

		if (items.length == 1) {
			let memory = items[0].memory;
			return memory;
		} else {
			logger.error('More then 1 item in World State with same id');

			let memory = items[0].memory;
			return memory;
		}
	} catch (error) {
		logger.error(error.message);
		throw Error(error);
	}
}

/**
 * Function to getSource of a contract
 * @param {string} contractId ID of the contract
 * @return {string} source of the node red flow
 */
async function getSource(contractId) {
	try {
		let result = await projectBlockchain.getTxById(contractId);
		let txData;
		if (!result) {
			throw Error('No such transaction in database...');
		}
		txData = result.txData;
		if (!txData) {
			throw Error('No such contract in database...');
		}

		let source = txData.asset.data.contractCreation.source;

		return source;
	} catch (error) {
		logger.error(error.message);
		return error.message;
	}
}

/**
 * its possible uses for mocks Mongo queries in unit-tests if it rendered in private function
 *
 * @param {string} templateName - contract template name
 * @return {object} Result with flowNodes and init properties
 */
const getDataFromDb = async function(templateName) {
	try {
		const result = await loopbackApp.models.nodeRedFlow.find({ where: { type: 'tab', label: templateName } });

		// check if flow exists
		if (!result || !result[0]) {
			throw Error('no such flow');
		}
		// check if duplicate name exists
		if (result.length > 1) {
			throw Error('The similar contract name already exists...');
		}

		let flowId = result[0].flowId;
		const flowNodes = await loopbackApp.models.nodeRedFlow.find({ where: { z: flowId } });
		const init = await loopbackApp.models.nodeRedFlow.find({ where: { z: flowId, name: 'init' } });

		if (!init || !init[0] || !init[0].flow.url) {
			logger.error('INIT function not defined');
			throw Error('no such flow');
		}
		return {
			flowNodes: flowNodes.map((r) => r.flow),
			init: init.map((r) => r.flow)
		};
	} catch (error) {
		logger.error(error.message);
		throw error;
	}
};

/**
 * @param {string} contractId - contract id
 * @param {string} functionName - name of the function
 * @param {object} functionArgs - arguments
 * @param {string} callerPubKey - callerPubKey
 * @param {object} remoteIp - remoteIp
 * @param {object} transferData - transfer information
 * @return {Promise} promise
 */
const execute = function(contractId, functionName, functionArgs, callerPubKey, remoteIp, transferData) {
	return new Promise((resolve, reject) => {
		redService = global.serviceManager.get('RED');

		let ownIp = configService.get('publicDNSName').split(':');
		ownIp = ownIp[0].replace('http://', '');

		let redEnv = {
			caller: callerPubKey,
			ownContractId: contractId,
			federationNodes: configService
				.get('federation_nodes')
				.concat([ configService.get('smartContractsHost') + ':' + configService.get('smartContractsPort') ]),
			ownIp: ownIp,
			http: {
				remote: {
					ip: remoteIp
				}
			}
		};

		let contractMemory = false;

		var executeFlow = function() {
			getMemory(loopbackApp.models, contractId)
				.then((memory) => {
					// for developer: !!!!!!!!!!!!! don't call contract.getMemory()
					contractMemory = memory;
					/*if (unconfirmedMemory[address]) {
            logger.info("!!!!!!!!!!!!!!! execute with 'in Block Memory'");
            contractMemory = unconfirmedMemory[address].memory;
            logger.info(contractMemory);
          } else {
            contractMemory = memory;
          }*/

					return getSource(contractId);
				})
				.then((sourceCode) => {
					let flows = JSON.parse(sourceCode);
					var changedIds = [];

					for (let i = 0; i < flows.length; i++) {
						if (changedIds[flows[i].id]) {
							flows[i].id = changedIds[flows[i].id];
						} else {
							var newId = Math.random().toString(36).substring(7);

							changedIds[flows[i].id] = newId;

							flows[i].id = newId;
						}
					}

					for (let i = 0; i < flows.length; i++) {
						if (flows[i].wires) {
							for (var f = 0; f < flows[i].wires.length; f++) {
								for (var o = 0; o < flows[i].wires[f].length; o++) {
									flows[i].wires[f][o] = changedIds[flows[i].wires[f][o]];
								}
							}
						}

						if (flows[i].url) {
							flows[i].url = '/execution_' + flows[i].url.replace('/', '');
						}
					}

					let tab = {
						id: executionFlowId,
						type: 'tab',
						label: 'smart-contract-execution',
						nodes: flows
					};

					redService.flows
						.add(tab, false)
						.then(async () => {
							// logger.info("ADDED FLOW");

							let callUrl = '/redapi';
							let methodExist = false;

							for (let i = 0; i < flows.length; i++) {
								let node = flows[i];
								if (
									functionName == node.name ||
									(node.url && functionName == node.url.replace('/', '').replace('execution_', ''))
								) {
									callUrl += node.url /* .replace("/", "")*/;
									methodExist = true;
									break;
								}
							}

							if (!methodExist) {
								throw Error('method not exist');
							}

							let result = await __callNodeRed(
								callUrl,
								functionArgs,
								contractMemory,
								redEnv,
								transferData
							);

							return resolve(result);
						})
						.catch((error) => {
							logger.error(error);
							reject(new Error(error));
						});

					return true;
				})
				.catch((error) => {
					logger.error(error);
					reject(new Error(error));
				});
		};

		try {
			redService.flows
				.remove(executionFlowId)
				.then(() => {
					executeFlow();
				})
				.catch((err) => {
					logger.error(err);
					executeFlow();
				});
		} catch (e) {
			executeFlow();
		}
	});
};

/**
 * @param {string} contractId - contract id
 * @param {string} functionName - name of the function
 * @param {object} functionArgs - arguments
 * @param {string} callerPubKey - callerPubKey
 * @param {object} remoteIp - remoteIp
 * @param {object} transferData - transfer information
 * @return {Object} NodeRedFlow Result
 */
const executeWithoutTab = async function(contractId, functionName, functionArgs, callerPubKey, remoteIp, transferData) {
	try {
		let ownIp = configService.get('publicDNSName').split(':');
		ownIp = ownIp[0].replace('http://', '');

		let redEnv = {
			caller: callerPubKey,
			ownContractId: contractId,
			federationNodes: configService
				.get('federation_nodes')
				.concat([ configService.get('smartContractsHost') + ':' + configService.get('smartContractsPort') ]),
			ownIp: ownIp,
			http: {
				remote: {
					ip: remoteIp
				}
			}
		};

		// read memory
		let memory = await getMemory(loopbackApp.models, contractId);
		// read SC source
		let sourceCode = await getSource(contractId);
		// read the flow nodes
		let flows = JSON.parse(sourceCode);

		let callUrl = '/redapi';
		let methodExist = false;

		for (let i = 0; i < flows.length; i++) {
			let node = flows[i];

			if (functionName == node.name) {
				callUrl += node.url /* .replace("/", "")*/;
				methodExist = true;
				break;
			}
		}

		if (!methodExist) {
			throw Error('method not exist');
		}

		let result = await __callNodeRed(callUrl, functionArgs, memory, redEnv, transferData);

		return result;
	} catch (error) {
		logger.error(error);
		throw new Error(error);
	}
};

/**
 * Function to publish a contract
 * @param {string} templateName - contract template name
 * @param {string} initArgs - arguments
 * @param {string} pubKey - public key
 * @param {Boolean} clientSigning - clientSigning
 * @return {String} returns the transaction
 */
const publish = async function(templateName, initArgs, pubKey, clientSigning) {
	try {
		initArgs = initArgs.toString();

		let env = {
			caller: pubKey,
			federationNodes: configService
				.get('federation_nodes')
				.concat([ configService.get('smartContractsHost') + ':' + configService.get('smartContractsPort') ])
		};

		let dataDb = await getDataFromDb(templateName);

		let flowNodes = dataDb.flowNodes;
		let init = dataDb.init;
		let initUrl = '/redapi' + init[0].url;
		initUrl += '?args=' + initArgs + '&env=' + JSON.stringify(env);

		let body = await request('http://127.0.0.1:' + configService.get('nodeRedPort') + initUrl);

		let result = JSON.parse(body);
		logger.info('new memory:');
		logger.info(result.memory);

		let data = {
			creatorKey: pubKey,
			source: flowNodes,
			memory: result.memory,
			sourceHash: crypto.createHash('md5').update(JSON.stringify(flowNodes)).digest('hex'),
			type: 'nodered'
		};

		let newContract = await create(data, pubKey, clientSigning);

		return newContract;
	} catch (err) {
		/*if (err.message === 'no such flow')
      return "No such flow !!";
    if (err.message === 'INIT function not defined')
      return false;*/
		logger.error(err);
		throw err;
	}
};

/**
 * Function to call a contract
 * @param {string} contractId - contract id
 * @param {string} functionName - name of the function
 * @param {object} functionArgs - passed arguments
 * @param {string} callerPubKey - callerPubKey
 * @param {Boolean} clientSigning - clientSigning
 * @param {string} remoteIp - remoteIp
 * @return {Object} contract memory / updated contract memory
 */
const call = async function(contractId, functionName, functionArgs, callerPubKey, clientSigning, remoteIp) {
	try {
		let result;
		const strategy = configService.get('scExecutionStrategy');
		switch (strategy) {
			case 'seperateFlow':
				result = await execute(contractId, functionName, functionArgs, callerPubKey, remoteIp);
				break;

			case 'existingFlow':
				result = await executeWithoutTab(contractId, functionName, functionArgs, callerPubKey, remoteIp);
				break;

			default:
				result = await execute(contractId, functionName, functionArgs, callerPubKey, remoteIp);
		}
		/*
		if (configService.get('sc_execution_tab') === 'true') {
			result = await execute(contractId, functionName, functionArgs, callerPubKey, remoteIp);
		} else {
			result = await executeWithoutTab(contractId, functionName, functionArgs, callerPubKey, remoteIp);
		}*/

		result = JSON.parse(result);
		if (result.memory) {
			let update = {
				contractId: contractId,
				contractType: 'nodered',
				caller: callerPubKey,
				memory: result.memory,
				functionName: functionName,
				args: functionArgs,
				previousCallId: unconfirmedMemory[contractId] ? unconfirmedMemory[contractId].latestTxId : false
			};

			let tx = await updateCall(update, callerPubKey, clientSigning);

			return { updateMemory: true, tx: tx, result: result };
		} else {
			return result;
		}
	} catch (error) {
		logger.error(error.message);
		throw error;
	}
};

/**
 * Function to transfer a contract
 * @param {object} data - transferData value as parameter
 * @return {Object} transferFlow Result
 */
const transferCall = async function(data) {
	try {
		let contractId = data.contractId;
		let functionName = data.functionName;
		let functionArgs = data.args;
		let assetId = data.assetId;
		let assetPubKey = data.assetPubKey;
		let clientSigning = data.clientSigning;
		let remoteIp = data.remoteIp;
		let nextOwner = data.nextOwner;
		let amount = data.amount;
		let latestTxId = data.latestTxId;
		let output = data.output;

		logger.info('TRANSFER CALL:', assetId, ', output:', output, '-- contractId:', contractId);

		let transferData;

		let flowExecutionResult;

		let assetData = await getTx(assetId);
		transferData = assetData.asset; //.data

		transferData.id = assetData.id;
		transferData.type = assetData.metadata.type; //assetData.metadata.contractUpdate.memory.asset_type

		transferData.amount = amount;

		// can it be an array?
		// transferData.creator = assetData.inputs[0].owners_before[0]; //transfer creator should be owner of the asset

		transferData.creator = assetData.inputs[0].owners_before[0];
		if (nextOwner) {
			transferData.outgoingDestination = nextOwner;
		}

		transferData.history = [];

		let transferResult;
		let result;

		const strategy = configService.get('scExecutionStrategy');
		switch (strategy) {
			case 'seperateFlow':
				result = await execute(contractId, functionName, functionArgs, assetPubKey, remoteIp, transferData);
				break;

			case 'existingFlow':
				result = await executeWithoutTab(
					contractId,
					functionName,
					functionArgs,
					assetPubKey,
					remoteIp,
					transferData
				);
				break;

			default:
				result = await execute(contractId, functionName, functionArgs, assetPubKey, remoteIp, transferData);
		}

		result = JSON.parse(result);

		if (result.rejected === 'true') {
			logger.error('Transaction rejected by Smart Contract');
			// return the result of contract execution
			return result;
		} else {
			result.allowTransfer = Boolean(result.allowTransfer == 'true' || result.allowTransfer);

			flowExecutionResult = result.result;

			if (result.allowTransfer == true) {
				latestTxId = result.result.id;
				nextOwner = flowExecutionResult.outgoingDestination;
			}

			let update = {
				contractId: contractId,
				contractType: 'nodered',
				memory: result.memory,
				functionName: functionName,
				args: functionArgs,
				allowTransfer: result.allowTransfer,
				changeAsset: result.changeAsset
			};
			// to define: assetLastTx and latestTx above.
			transferResult = await updateTransfer(
				update,
				assetPubKey,
				clientSigning,
				nextOwner,
				amount,
				latestTxId,
				output
			);
		}

		let flowExecObj = flowExecutionResult ? flowExecutionResult : {};

		if (typeof flowExecObj === 'string') {
			flowExecObj = {
				result: flowExecObj
			};
		}

		if (transferResult.rejected != 'true') {
			flowExecObj.transferTxId = transferResult;
		} else {
			flowExecObj = transferResult;
		}

		return flowExecObj;
	} catch (error) {
		logger.error(error.message);
		throw error;
	}
};

/**
 * Function to call NodeRed
 * @param {string} callUrl - callUrl value as parameter
 * @param {object} args - args as parameter
 * @param {object} worldMemory - worldMemory value as parameter
 * @param {object} env - env variable as parameter
 * @param {object} transferData - transferData value as parameter
 * @return {Promise} on command finish
 * @ignore
 */
function __callNodeRed(callUrl, args, worldMemory, env, transferData) {
	return new Promise((resolve) => {
		if (!transferData) transferData = {};

		try {
			args = args.join('@');
		} catch (e) {}

		callUrl = `${callUrl}?world_memory=${JSON.stringify(worldMemory)}&args=${args}&env=${JSON.stringify(
			env
		)}&transferData=${JSON.stringify(transferData)}`;

		logger.info('* node-red flow *');
		logger.info('* callUrl *', callUrl);

		var options = {
			host: '127.0.0.1',
			port: configService.get('nodeRedPort'),
			path: encodeURI(callUrl)
		};

		let callback = function(response) {
			var body = '';

			// another chunk of data has been recieved, so append it to `str`
			response.on('data', function(chunk) {
				body += chunk;
			});
			// the whole response has been recieved, so we just print it out here
			response.on('end', function() {
				return resolve(body);
			});
		};

		var req = http.request(options, callback);

		req.on('error', function(error) {
			logger.error('error:');
			logger.error(error);
		});

		req.end();
	});
}

/**
   * @param {object} pluginSettings plugin settings
   * @return {object} public values of the plugin
   */
const getPublicPluginConfiguration = (pluginSettings) => {
	const pluginInfo = {
		routeValidation: pluginSettings.get('routeValidation')
	};
	return pluginInfo;
};

module.exports = (services) => {
	configService = services.get('configService');
	loopbackApp = services.get('loopbackApp');
	projectBlockchain = services.get('bc.abci-project');
	keyPairService = services.get('resolveKeyPair');
	digitalAssetService = services.get('digitalAsset');

	return {
		configure,
		create,
		updateCall,
		updateTransfer,
		getMemory,
		getSource,
		transferCall,
		getTx,
		execute,
		executeWithoutTab,
		publish,
		call,
		getPublicPluginConfiguration
	};
};
