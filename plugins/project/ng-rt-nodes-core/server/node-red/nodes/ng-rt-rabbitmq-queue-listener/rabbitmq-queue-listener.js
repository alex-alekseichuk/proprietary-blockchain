'use strict';
const logger = require('log4js').getLogger('rabbitmq-queue-listener');

module.exports = RED => {
  /**
   * RabbitMQ queue listener node
   * @param {Object} config - configuration of node
   */
  function listener(config) {
    let self = this;

    self.status({fill: "yellow", shape: "ring", text: "connecting"});
    RED.nodes.createNode(this, config);
    const service = global.serviceManager.get('rabbitMQ');
    let queueName = config.queue;

    service.subscribeToQueue(queueName, (message, headers, deliveryInfo, messageObject) => {
      logger.debug(`RabbitMQ queue ${queueName} message:`, message, headers, deliveryInfo, messageObject);
      self.send({payload: message});
    }, () => {
      self.status({fill: "green", shape: "dot", text: "connected"});
    });
  }
  RED.nodes.registerType("rabbitmq-queue-listener", listener);
};
