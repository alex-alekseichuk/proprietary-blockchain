'use strict';
var logger = require('log4js').getLogger('publish');
const { publishContract } = require('ng-rt-smartContracts-driver');

module.exports = function(RED) {
	/**
   *
   * @param {*} config Condig
   */
	function publish(config) {
		RED.nodes.createNode(this, config);

		var templateName = config.templateName;
		var args = config.args;
		this.on('input', async function(msg) {
			const contractId = await publishContract(msg.txContext, msg.pubKey, false, templateName, args);
			msg.contractId = contractId;
			logger.debug('Contract published!!');
			msg.payload = contractId;
			this.send(msg);
		});
	}

	RED.nodes.registerType('publish', publish);
};
