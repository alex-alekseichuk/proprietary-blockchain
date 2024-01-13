/* eslint-disable no-loop-func */

'use strict';

const logger = require('log4js').getLogger('ng-rt-abci-server.routes');
var rp = require('request-promise');

/**
 * API/Route/ng-rt-abci-server
 *
 * @module API/Route/ng-rt-abci-server
 * @type {Object}
 */

let server;
let pluginSettings;
let namespace;
let tendermintPort;
let tendermintUrl;

const init = (_server, plugin) => {
  server = _server;
  pluginSettings = server.plugin_manager.configs.get('ng-rt-abci-server');
  namespace = pluginSettings.get('namespace');
  tendermintUrl = pluginSettings.get('tendermintUrl');
  tendermintPort = pluginSettings.get('tendermintPort');
};

const tmroute = (req, res) => {
  let showRoutes = pluginSettings.get('showRoutes');
  logger.info('req.route.path : ', req.route.path);
  logger.info('showRoutes : ', showRoutes);
  const splitString = req.route.path.split("/");
  let route = splitString[2];
  logger.info('route : ', route);

  if (showRoutes === 'true') {
    var options = {
      uri: `http://${tendermintUrl}:${tendermintPort}/${route}`,
      headers: {
        'Content-Type': 'application/json-rpc',
        'Accept': 'application/json'
      },
      json: true // Automatically parses the JSON string in the response
    };
    rp(options)
      .then(function(json) {
        res.status(200);
        res.json(json);
        return res;
      })
      .catch(function(err) {
        logger.error('Error :', err);
        res.status(500);
        res.json(err);
        return res;
      });
  } else {
    res.status(500);
    res.json({
      error: 'Route not activated'
    });
    return res;
  }
};

const activate = (server, plugin, pluginInstance) => {
  logger.debug('routes of tmroutes getting activated');
  init(server, plugin);
  /**
   * Retrieve tendermint status
   *
   * @name  Retrieve tendermint status
   * @route {GET} /${namespace}/status
   * @authentication None
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/status`, tmroute);
  /**
   * Retrieve tendermint health
   *
   * @name  Retrieve tendermint status
   * @route {GET} /${namespace}/status
   * @authentication None
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/health`, tmroute);
   /**
   * Retrieve tendermint abci_info
   *
   * @name  Retrieve tendermint abci_info
   * @route {GET} /${namespace}/abci_info
   * @authentication None
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/abci_info`, tmroute);
   /**
   * Retrieve tendermint consensus_state
   *
   * @name  Retrieve tendermint consensus_state
   * @route {GET} /${namespace}/consensus_state
   * @authentication None
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/consensus_state`, tmroute);
  /**
   * Retrieve tendermint dump_consensus_state
   *
   * @name  Retrieve tendermint dump_consensus_state
   * @route {GET} /${namespace}/dump_consensus_state
   * @authentication None
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/dump_consensus_state`, tmroute);
  /**
   * Retrieve tendermint genesis
   *
   * @name  Retrieve tendermint genesis
   * @route {GET} /${namespace}/genesis
   * @authentication None
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/genesis`, tmroute);
  /**
   * Retrieve tendermint net_info
   *
   * @name  Retrieve tendermint net_info
   * @route {GET} /${namespace}/net_info
   * @authentication None
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/net_info`, tmroute);
  /**
   * Retrieve tendermint num_unconfirmed_txs
   *
   * @name  Retrieve tendermint num_unconfirmed_txs
   * @route {GET} /${namespace}/num_unconfirmed_txs
   * @authentication None
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/num_unconfirmed_txs`, tmroute);
};

const deactivate = {
  abci_info: {
    path: "/${namespace}/abci_info",
    type: "get"
  },
  consensus_state: {
    path: "/${namespace}/consensus_state",
    type: "get"
  },
  dump_consensus_state: {
    path: "/${namespace}/dump_consensus_state",
    type: "get"
  },
  genesis: {
    path: "/${namespace}/genesis",
    type: "get"
  },
  health: {
    path: "/${namespace}/health",
    type: "get"
  },
  net_info: {
    path: "/${namespace}/net_info",
    type: "get"
  },
  num_unconfirmed_txs: {
    path: "/${namespace}/num_unconfirmed_txs",
    type: "get"
  },
  status: {
    path: "/${namespace}/status",
    type: "get"
  }
};

module.exports = {
  init,
  activate,
  deactivate,
  tmroute
};
/*
// without parameters
//localhost:26657/abci_info
//localhost:26657/consensus_state
//localhost:26657/dump_consensus_state
//localhost:26657/genesis
//localhost:26657/health
//localhost:26657/net_info
//localhost:26657/num_unconfirmed_txs
//localhost:26657/status
//
// with parameter
//localhost:26657/abci_query?path=_&data=_&height=_&trusted=_
//localhost:26657/block?height=_
//localhost:26657/block_results?height=_
//localhost:26657/blockchain?minHeight=_&maxHeight=_
//localhost:26657/broadcast_tx_async?tx=_
//localhost:26657/broadcast_tx_commit?tx=_
//localhost:26657/broadcast_tx_sync?tx=_
//localhost:26657/commit?height=_
//localhost:26657/subscribe?query=_
//localhost:26657/tx?hash=_&prove=_
//localhost:26657/tx_search?query=_&prove=_&page=_&per_page=_
//localhost:26657/unconfirmed_txs?limit=_
//localhost:26657/unsubscribe?query=_
//localhost:26657/unsubscribe_all?
//localhost:26657/validators?height=_
*/
