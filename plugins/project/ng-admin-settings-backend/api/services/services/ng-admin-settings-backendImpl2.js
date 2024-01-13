'use strict';
const logger = require('log4js').getLogger('ng-admin-settings-backend.serviceImpl2');

const addTwoStrings = (x = "Hello", y = "World") => {
  let string = x + " " + y;
  return string;
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
  addTwoStrings
};
