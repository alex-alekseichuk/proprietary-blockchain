/* eslint-disable no-loop-func */

'use strict';

const logger = require('log4js').getLogger('ng-rt-abci-server.routes');
const tmTxDS = require('./../commands/blockchain/dataService/tmTxDS');

/**
 * API/Route/ng-rt-abci-server
 *
 * @module API/Route/ng-rt-abci-server
 * @type {Object}
 */

let server;
let pluginSettings;
let namespace;
let abciServerPort;

const init = (_server, plugin) => {
  server = _server;
  pluginSettings = server.plugin_manager.configs.get('ng-rt-abci-server');
  namespace = pluginSettings.get('namespace');
  abciServerPort = pluginSettings.get('abciServerPort');
};

const info = (req, res) => {
  logger.debug('Status route');

  var result = {
    tmStatus: "Tendermint active",
    abciPort: abciServerPort
  };
  return res.send(result);
};

const tmtx = (req, res) => {
  logger.debug('fetching TmTx');
  let models = server.models;
  tmTxDS.findOne(models.tmTx, req.query.id).then(result => {
    logger.info('result: ', result);
    if (result !== null) {
      var record = {
        tmtx: result.txData
      };
      return res.send(record);
    }
    return res.status(400).send('Transaction with id ' + req.query.id + ' not found');
  });
};
const activate = (server, plugin, pluginInstance) => {
  logger.debug('routes of routes getting activated');
  init(server, plugin);

  /**
   * Retrieve tendermint status
   *
   * @name  Retrieve tendermint status
   * @route {GET} /${namespace}/info
   * @authentication None
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/info`, info);

  /**
   * Retrieve a tx by id
   *
   * @name  Retrieve a tx by id
   * @route {GET} /${namespace}/tmtx
   * @authentication None
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/tmtx`, tmtx);
};

const deactivate = {
  info: {
    path: "/${namespace}/info",
    type: "get"
  },
  tmtx: {
    path: "/${namespace}/tmtx",
    type: "get"
  }
};

module.exports = {
  init,
  activate,
  deactivate,
  info
};
