'use strict';
var logger = require('log4js').getLogger('transferCall');
const { transferCallContract } = require('ng-rt-smartContracts-driver');

module.exports = function(RED) {
	/**
   *
   * @param {*} config Condig
   */
	function transferCall(config) {
		RED.nodes.createNode(this, config);
		var contractId = config.contractId;
		var assetId = config.assetId;
		this.on('input', async function(msg) {
			let result = await transferCallContract(
				msg.txContext,
				msg.pubKey,
				false,
				contractId,
				msg.functionName,
				assetId,
				msg.amount,
				msg.latestTxId,
				msg.nextOwner,
				msg.args
			);

			msg.payload = result;
			logger.debug('Calling contract !!');
			this.send(msg);
		});
	}

	RED.nodes.registerType('transferCall', transferCall);
};
