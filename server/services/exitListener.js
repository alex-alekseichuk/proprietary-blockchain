"use strict";
const logger = require('log4js').getLogger('exitListeners');

module.exports = (init, i18n) => {
  let listeners = {};
  const run = () => {
    logger.debug('Run exit listeners');
    return Promise.all(Object.keys(listeners).map(l => {
      if (listeners.hasOwnProperty(l) && typeof listeners[l] === 'function') {
        return listeners[l]();
      }
      return undefined;
    }));
  };

  if (init && typeof init === 'function')
    init(run);

  return {
    add: async (name, callback) => {
      if (!name)
        return Promise.reject(i18n.__('name is required to subsribe'));
      if (listeners[name])
        return Promise.reject(name + " " + i18n.__('listener already added'));
      listeners[name] = callback;
      return Promise.resolve();
    },
    remove: async name => {
      if (!listeners[name])
        return Promise.reject(name + " " + i18n.__("listener not exist"));
      delete listeners[name];
      return Promise.resolve();
    }
  };
};
