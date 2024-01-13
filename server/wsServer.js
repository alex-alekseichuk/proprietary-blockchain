/**
 * 1. Websocket Server with authentication
 * 2. ListenController and Dispatcher
 * 3. blockchainListenWs
 *
 * @requires websocket server from ng-common/nodejs
 */
/*eslint new-cap: 0*/
'use strict';
const express = require('express');
const log4js = require('log4js');
const log4jsAdapter = require('../utils/log4jsAdapter');
const {common, nodejs} = require('ng-common');

const factory = (loopbackApp, httpServer, authService, rabbitMQ, rabbitmqPublisher) => {
  const logger = log4js.getLogger('core/server/wsServer');
  const wsServer = nodejs.server.wsServer(log4jsAdapter, httpServer);

  if (authService)
    wsServer.on('auth', (message, ws) => {
      if (!message.token)
        return;
      authService.processAccessToken(message.token).then(result => {
        if (typeof result === 'object') {
          ws.context = result;
        }
      });
    });

  const blockchainCache = nodejs.server.blockchain.memoryCache();
  const blockchainStorage = nodejs.server.blockchain.memoryStorage(); // TODO: switch to abciStorage

  const listen = nodejs.server.listenController();
  const blockchainListenWs = nodejs.server.blockchain.blockchainListenWs(log4jsAdapter,
    wsServer, listen.__components.listenController, listen.__components.listenDispatcher, blockchainCache);

  const blockchainList = nodejs.server.blockchain.blockchainList(log4jsAdapter, blockchainStorage, blockchainCache);
  const router = express.Router();
  loopbackApp.use('/apiBlockchain/', router);
  nodejs.server.blockchain.blockchainListRoutes(log4jsAdapter, blockchainList, router,
    (req, res, next) => next());
  router.use((req, res) => {});

  if (rabbitmqPublisher) {
    logger.debug(`websocket: rabbitmqPublisher`);
    rabbitmqPublisher.addDeliverTxPublisher(rabbitmqPublisher.types.fanout, 'txConfirmed_feed', null, true);
    rabbitmqPublisher.addRejectedTxPublisher(rabbitmqPublisher.types.fanout, 'txRejected_feed', null, true);
  } else {
    logger.debug(`websocket: no rabbitmqPublisher`);
  }

  const forwardMessage = (message, status, messageType) => {
    const abciTx = message.message.tx;
    let txRecord = Object.assign({
      id: abciTx.id,
      status,
      timestamp: common.util.timestamp(),
      tx: abciTx
    }, abciTx.asset.data);
    if(messageType){
      txRecord.messageType = messageType;
    }
    blockchainListenWs.notify(txRecord);
    blockchainCache.update(txRecord);
  }

  rabbitMQ.subscribeToFanout("txConfirmed_feed", async message => {
    forwardMessage(message, 'confirmed');
  });

  rabbitMQ.subscribeToFanout("txRejected_feed", async message => {
    forwardMessage(message, 'rejected', message.message.messageType);
  });

  return {
    wsServer,
    listenController: listen.__components.listenController,
    listenDispatcher: listen.__components.listenDispatcher,
    blockchainListenWs,
    blockchainCache
  };
};

module.exports = factory;
factory.__dependencies = ['loopbackApp', 'httpServer', 'auth-check.service', 'rabbitMQ',
  'ng-rt-abci-server-rabbitmq-publisherService'];
factory.__components = [
  {name: "wsServer"},
  {name: "listenController"},
  {name: "listenDispatcher"},
  {name: "blockchainListenWs"},
  {name: 'blockchainCache'}
];
