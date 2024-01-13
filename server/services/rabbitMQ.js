/**
 * RabbitMQ Service
 */
'use strict';
const logger = require('log4js').getLogger('rabbitMQ.service');

/**
 * API/Service/RabbitMQ
 *
 * @module API/Service/RabbitMQ
 * @type {object}
 */

module.exports = config => {
  let uniqueId = require("crypto").randomBytes(16).readInt16BE();
  let subscribers = {};
  let qSubs = {};

  /**
   * get connection to RabbitMQ
   * @return {object} - instance of connection to RabbitMQ
   */
  const connecting = () => {
    return require('../backend/rabbitMQ').getConnection(config);
  };

  /**
   * unsubscribe from queue
   * @param {string} queueName - name of queue
   * @param {function} plugin - subscriber name
   */
  const unsubscribeFromQueue = (queueName, plugin) => {
    if (!plugin)
      plugin = '-';
    if (qSubs[queueName] && qSubs[queueName][plugin])
      delete qSubs[queueName][plugin];
  };

  /**
   * subscribe to queue
   * @param {string} queueName - name of queue
   * @param {function} messageCallback - callback on message sended to queue
   * @param {function} connectedCallback - callback on connected to queue
   * @param {string} plugin - subscriber name to ident
   * @param {boolean} force - option to force subscription if exist
   */
  const subscribeToQueue = (queueName, messageCallback, connectedCallback, plugin, force) => {
    if (!qSubs[queueName]) {
      qSubs[queueName] = {};
      qSubs[queueName][plugin] = messageCallback;
      let connection = connecting();
      connection.then(conn => {
        return conn.createChannel();
      }).then(ch => {
        logger.trace("channel created");
        return ch.assertQueue(queueName).then(ok => {
          logger.trace("assert queue", queueName);
          if (connectedCallback && typeof connectedCallback == "function")
            connectedCallback();
          ch.consume(queueName, msg => {
            logger.trace(`message from ${queueName}`, msg);
            // qSubs[queueName].forEach(s => s(msg.content));
            for (let plg in qSubs[queueName])
              if (qSubs[queueName].hasOwnProperty(plg))
                qSubs[queueName][plg](msg.content);
            ch.ack(msg);
          });
        });
      });
    }
    if (!plugin)
      plugin = '-';
    if (qSubs[queueName][plugin]) {
      if (!force)
        throw new Error('Already subscribed');
      unsubscribeFromQueue(queueName, plugin);
      qSubs[queueName][plugin] = messageCallback;
      connectedCallback();
      return;
    }
  };

  /**
   * subscribe to fanaout exchange
   * @param {string} exchangeName - name of exhange
   * @param {function} messageCallback - callback on message sended to exchange
   * @param {function} connectedCallback - callback on connected to exchange
   */
  const subscribeToFanoutExchange = (exchangeName, messageCallback, connectedCallback) => {
    logger.trace('subscribeToFanoutExchange', exchangeName);
    let connection = connecting();
    connection.then(conn => {
      return conn.createChannel();
    }).then(ch => {
      logger.trace("channel created");
      ch.assertExchange(exchangeName, "fanout", {durable: true, autoDelete: true}).then(ok => {
        logger.trace('exhange created', exchangeName);
        let qName = `${exchangeName}_${uniqueId}`;
        ch.assertQueue(qName).then(ok => {
          logger.trace('queue asserted', qName);
          if (connectedCallback && typeof connectedCallback == "function")
            connectedCallback();
          return ch.bindQueue(qName, exchangeName);
        }).then(ok => {
          ch.consume(qName, message => {
            if (message && message.content) {
              try {
                let msg = JSON.parse(message.content.toString());
                if (msg.producerId !== uniqueId)
                  messageCallback(msg.message);
                logger.trace("message", exchangeName, msg);
              } catch (err) {
                logger.error("Error parse json", err);
              }
            } else {
              messageCallback();
            }
            ch.ack(message);
          });
        });
      });
    });
  };

  /**
   * subscribe to fanout
   * @param {string} exchangeName - name of exhange
   * @param {function} messageCallback - callback on message sended to exchange
   * @param {function} connectedCallback - callback on connected to exchange
   */
  const subscribeToFanout = (exchangeName, messageCallback, connectedCallback) => {
    logger.trace('subscribeToFanout', exchangeName);
    if (subscribers[exchangeName]) {
      subscribers[exchangeName].push(messageCallback);
      if (connectedCallback && typeof connectedCallback === "function")
        connectedCallback();
      return;
    }
    subscribers[exchangeName] = [messageCallback];

    let connection = connecting();
    connection.then(conn => {
      return conn.createChannel();
    }).then(ch => {
      logger.trace("channel created");
      ch.assertExchange(exchangeName, "fanout", {durable: true, autoDelete: true}).then(ok => {
        logger.trace('exchange asserted', exchangeName);
        let qName = `${exchangeName}_${uniqueId}`;
        ch.assertQueue(qName).then(ok => {
          logger.trace('queue created', qName, ok);
          // if (connectedCallback && typeof connectedCallback === "function")
          //   connectedCallback();
          return ch.bindQueue(qName, exchangeName);
        }).then(ok => {
          logger.trace(`receive ${JSON.stringify(ok, null, 2)}`);
          if (connectedCallback && typeof connectedCallback === "function")
            connectedCallback();
          ch.consume(qName, message => {
            logger.trace('consume message', message);
            if (message && message.content) {
              try {
                logger.trace(`has content ${typeof message.content}`);
                let msg = JSON.parse(message.content.toString());
                logger.trace(`msg: ${msg}`);
                logger.trace(`exchangeName: ${exchangeName}`);
                logger.trace(`subscribers: ${subscribers[exchangeName].length}`);
                subscribers[exchangeName].forEach(s => s(msg));
                logger.trace("message", exchangeName, msg);
              } catch (err) {
                logger.error("Error parse json", err);
              }
            } else {
              messageCallback();
            }
            ch.ack(message);
          });
        });
      });
    });
  };

  /**
   * unsubscribe from fanaout
   * @param {string} exchangeName - name of exhange
   * @param {function} messageCallback - callback on message sended to exchange
   */
  const unsubscribeFromFanout = (exchangeName, messageCallback) => {
    if (subscribers[exchangeName]) {
      subscribers[exchangeName] = subscribers[exchangeName].filter(x => x !== messageCallback);
    }
  };

  /**
   * publish message to fanout exhange
   * @param {string} exchangeName - exchange name
   * @param {object} message - message to send
   * @return {Promise} result
   */
  const publishFanout = (exchangeName, message) => {
    let connection = connecting();
    return connection.then(conn => {
      return conn.createChannel();
    }).then(ch => {
      ch.assertExchange(exchangeName, "fanout", {durable: true, autoDelete: true}).then(ok => {
        return ch.publish(exchangeName, "", Buffer.from(JSON.stringify({producerId: uniqueId, message: message}), 'utf8'));
      }).catch(err => {
        logger.error(err);
      });
    });
  };

  /**
   * publish message to topic exhange
   * @param {string} exchangeName - exchange name
   * @param {object} routingKey - name of the routing key
   * @param {object} message - message to send
   * @return {Promise} result
   */
  const publishTopic = (exchangeName, routingKey, message) => {
    let connection = connecting();
    return connection.then(conn => {
      return conn.createChannel();
    }).then(ch => {
      ch.assertExchange(exchangeName, "topic").then(ok => {
        logger.trace(`message: ${message}`);
        logger.trace(`exchangeName: ${exchangeName}`);
        logger.trace(`routingKey: ${routingKey}`);
        return ch.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(message)));
      });
    });
  };

  /**
   * publish message to Queue
   * @param {string} queue - queue name
   * @param {object} message - message to send
   * @return {Promise} result
   */
  const publishQueue = (queue, message) => {
    let connection = connecting();
    return connection.then(conn => {
      return conn.createChannel();
    }).then(ch => {
      ch.assertQueue(queue, {durable: true}).then(ok => {
        logger.trace(`message send to queue: ${message}`);
        return ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
      });
    });
  };

  return {
    subscribeToQueue,
    unsubscribeFromQueue,
    subscribeToFanoutExchange,
    subscribeToFanout,
    unsubscribeFromFanout,
    publishFanout,
    publishTopic,
    publishQueue
  };
};
