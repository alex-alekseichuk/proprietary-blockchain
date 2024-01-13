'use strict';
var logger = require('log4js').getLogger('call');
const { callContractFunction } = require('ng-rt-smartContracts-driver');

module.exports = function(RED) {
	/**
   *
   * @param {*} config Condig
   */
	function call(config) {
		RED.nodes.createNode(this, config);
		var contractId = config.contractId;
		this.on('input', async function(msg) {
			const result = await callContractFunction(
				msg.txContext,
				msg.pubKey,
				false,
				contractId,
				msg.functionName,
				msg.assetType,
				'1',
				msg.args
			);
			msg.payload = result;
			logger.debug('Calling contract !!');
			this.send(msg);
		});
	}

	RED.nodes.registerType('call', call);
};
