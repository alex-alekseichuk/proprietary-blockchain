/**
 * Interface to access rabbitMQ directly.
 */
'use strict';
const logger = require('log4js').getLogger('rabbitMQ');
const amqplib = require('amqplib');

var pconnection = null;
var connection = null;
var connecting = false;
var queue = 'healttcheck';

const getConnection = config => {
  logger.trace('Trying to connect to rabbitMQ');
  const messagingHost = config.get('messagingHost') || '127.0.0.1';
  const messagingPort = config.get('messagingPort') || 5172;
  if (connecting) {
    return pconnection;
  }
  return new Promise((resolve, reject) => {
    if (!connection || (connection.connection.stream.destroyed && !connection.connection.stream.connecting)) {
      pconnection = amqplib.connect(`amqp://${messagingHost}:${messagingPort}`);
      connecting = true;
      pconnection
        .then(conn => {
          logger.debug('Successfully connected to RabbitMQ');
          connection = conn;
          connecting = false;
          resolve(pconnection);
        })
        .catch(err => {
          connecting = false;
          logger.error(err.message);
          reject(err);
        });
    } else {
      logger.debug('Using existing connection to RabbitMQ');
      connecting = false;
      resolve(pconnection);
    }
  });
};

const checkConnection = config => {
  return Promise.all([
    // Publisher
    getConnection(config).then(function(conn) {
      return conn.createChannel();
    }).then(function(ch) {
      return ch.assertQueue(queue).then(function(ok) {
        return ch.sendToQueue(queue, new Buffer('Sending a dummy messaging'));
      });
    }).catch(err => {
      logger.error('No RabbitMQ connection for Publisher established');
      logger.error(err);
      throw err;
    }),

    // Consumer
    getConnection(config).then(function(conn) {
      return conn.createChannel();
    }).then(function(ch) {
      return ch.assertQueue(queue).then(function(ok) {
        return ch.consume(queue, function(msg) {
          if (msg !== null) {
            logger.trace(msg.content.toString());
            logger.info('Successfully consume RabbitMQ');
            ch.ack(msg);
          }
        });
      });
    }).catch(err => {
      logger.error('No RabbitMQ connection for consumer established');
      logger.error(err);
      throw err;
    })
  ]);
};

const connect = config => checkConnection(config);

module.exports = {
  connect,
  getConnection
};
