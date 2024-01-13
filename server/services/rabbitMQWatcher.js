/**
 * Blockchain watcher implementation based onRabbitMQ.
 */
'use strict';
const logger = require('log4js').getLogger('rabbitMqWatcher');

/**
 * API/Service/RabbitMqWatcher
 *
 * @module API/Service/RabbitMqWatcher
 * @type {object}
 */

 /**
  *
  * @param {*} rabbitMQ rabbitMQ
  * @return {*} waiter waiter
  */
function factory(rabbitMQ) {
  /**
   * getWaiter
   * @return {*} waiter waiter
   */
  function getWaiter() {
    const waiter = {};

    waiter.txPosted = new Promise((resolvePosted, rejectPosted) => {
      let timeout;

      /**
       *
       * @param {*} tx tx
       */
      function listen(tx) {
        if (tx) {
          if (tx instanceof Buffer) {
            tx = tx.toString();
          }
          if (typeof tx === 'string') {
            try {
              tx = JSON.parse(tx);
            } catch (err) {
              logger.error(err);
            }
          }
          logger.trace('TX', tx);

          if (tx.id && tx.id === waiter.txId) {
            if (stop())
              resolvePosted(tx);
          }
        }
      }

      /**
       * Stop the watcher
       * @return {*} boolean returns a boolean
       */
      function stop() {
        if (timeout) {
          timeout = null;
          clearTimeout(timeout);
          rabbitMQ.unsubscribeFromQueue('bigchaindb', listen);
          return true;
        }
        return false;
      }

      waiter.stop = () => {
        if (stop())
          rejectPosted(new Error("TX waiting stopped"));
      };

      waiter.wait = (txId, period) => {
        return new Promise(resolveWaiting => {
          waiter.txId = txId;

          timeout = setTimeout(() => {
            if (stop())
              rejectPosted(new Error("TX waiting timeout"));
          }, period || 60000);

          rabbitMQ.subscribeToQueue('bigchaindb', listen, () => {
            resolveWaiting();
          });
        });
      };
    });

    return waiter;
  }

  return {
    /**
     * Create new waiter object
     * @return {object} waiter object
     */
    getWaiter
  };
}

module.exports = factory;
factory.__dependencies = ['rabbitMQ'];
factory.__components = 'watcher';
