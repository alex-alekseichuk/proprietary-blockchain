'use strict';

const _ = require('lodash');

module.exports = (() => {
  let data = {
    keys: {
      alice: null,
      bob: null
    },
    createTx: null,
    transferTx: null

  };

  return {
    get: () =>
      _.cloneDeep(data),
    set: obj => {
      data = _.merge(data, obj);
    }
  };
})();
