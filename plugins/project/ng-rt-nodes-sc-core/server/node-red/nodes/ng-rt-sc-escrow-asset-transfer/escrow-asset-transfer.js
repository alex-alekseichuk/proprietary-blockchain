'use strict';
var logger = require('log4js').getLogger('escrow-asset-transfer');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Condig
   */
  function escrowAssetTransfer(config) {
    RED.nodes.createNode(this, config);

    this.on('input', function(msg) {
      let tmtx = msg.payload.result;
        // msg.payload={};
      let pubKey = msg.transferData.outgoingDestination;

      if (tmtx[0].txData.inputs[0].owners_before == pubKey) {
        let tmtxId = tmtx[1].txId;

        msg.transferData.id = tmtxId;
        logger.debug("exchange asset id");

        this.send(msg);
      } else {
        let tmtxId = tmtx[0].txId;

        msg.transferData.id = tmtxId;
        logger.debug("exchange asset id");

        this.send(msg);
      }
    });
  }

  RED.nodes.registerType("escrow-asset-transfer", escrowAssetTransfer);
};
