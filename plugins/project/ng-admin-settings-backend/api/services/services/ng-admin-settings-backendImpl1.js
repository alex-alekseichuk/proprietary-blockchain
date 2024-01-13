'use strict';
const logger = require('log4js').getLogger('ng-admin-settings-backend.serviceImpl1');

const addTwoNumbers = (x = 5, y = 7) => {
  logger.info(`adding two numbers ${x} and ${y} `);
  let sum = x + y;
  return sum;
};

const subscribe = () => {
  logger.debug('subscribe');
};

const unsubscribe = () => {
  logger.debug('unsubscribe');
};

module.exports = {
  subscribe,
  unsubscribe,
  addTwoNumbers
};
