'use strict';
// const logger = require('log4js').getLogger('ng-rt-abci-server-rabbitmq-publisher.service');

const rabbitMQtypes = {
  fanout: 'fanout',
  queue: 'queue'
};

module.exports = services => {
  let rabbitmqService = services.get('rabbitMQ');

  let subscribers = {
    deliverTx: [],
    rejectedTx: []
  };

  const filter = (subscriber, parsedTx) => {
    if (!parsedTx)
      throw new Error('Parsed tx required');
    if (!parsedTx.tx)
      throw new Error('Transaction doesn\'t exist');
    if (!parsedTx.assetDescriptor)
      throw new Error('Asset definition doesn\'t exist');
    if (subscriber.assetType && subscriber.assetType !== parsedTx.assetDescriptor.assetType)
      return false;
    return true;
  };
  /**
   * add publisher to rabbitmq for deliver tx command
   * @param {string} publishType - type of publishing for rabbitmq
   * @param {string} name - publish name
   * @param {string} assetType - asset type
   * @param {boolean} includeTx - true if need include transaction body to rabbitmq message
   */
  const addDeliverTxPublisher = (publishType, name, assetType, includeTx) => {
    if (!Object.keys(rabbitMQtypes).includes(publishType))
      throw new Error(`RabbitMQ publish type - ${publishType} doesn't supported`);
    subscribers.deliverTx.push({publishType, name, assetType, includeTx});
  };

  const getTxMessage = (options, parsedTx) => {
    let message = {};
    message.txId = parsedTx.tx.id;
    message.type = parsedTx.assetDescriptor.assetType;
    if (options) {
      if (options.includeTx) {
        message.tx = parsedTx.tx;
      }
    }
    return message;
  };

  /**
   * on deliver tx
   * @param {object} parsedTx delivered transaction info
   */
  const deliverTx = parsedTx => {
    subscribers.deliverTx.forEach(subscriber => {
      let {name, publishType} = subscriber;
      if (!filter(subscriber, parsedTx))
        return;
      let message = getTxMessage(subscriber, parsedTx);
      switch (publishType) {
        case rabbitMQtypes.fanout:
          rabbitmqService.publishFanout(name, message);
          break;
        case rabbitMQtypes.queue:
          rabbitmqService.publishQueue(name, message);
          break;
        default:
      }
    });
  };

  /**
   * add publisher to rabbitmq for rejected tx command
   * @param {string} publishType - type of publishing for rabbitmq
   * @param {string} name - publish name
   * @param {string} assetType - asset type
   * @param {boolean} includeTx - true if need include transaction body to rabbitmq message
   */
  const addRejectedTxPublisher = (publishType, name, assetType, includeTx) => {
    if (!Object.keys(rabbitMQtypes).includes(publishType))
      throw new Error(`RabbitMQ publish type - ${publishType} doesn't supported`);
    subscribers.rejectedTx.push({publishType, name, assetType, includeTx});
  };

  /**
   * on Rejected tx
   * @param {string} messageType CheckTx/DeliverTx
   * @param {object} parsedTx delivered transaction info
   */
  const rejectedTx = (messageType, parsedTx) => {
    subscribers.rejectedTx.forEach(subscriber => {
      let {name, publishType} = subscriber;
      if (!filter(subscriber, parsedTx))
        return;
      let txMessage = getTxMessage(subscriber, parsedTx);
      let message = Object.assign(txMessage, {messageType});
      switch (publishType) {
        case rabbitMQtypes.fanout:
          rabbitmqService.publishFanout(name, message);
          break;
        case rabbitMQtypes.queue:
          rabbitmqService.publishQueue(name, message);
          break;
        default:
      }
    });
  };

  return {
    addDeliverTxPublisher,
    deliverTx,
    types: rabbitMQtypes,
    addRejectedTxPublisher,
    rejectedTx
  };
};
