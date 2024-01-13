"use strict";
const values = require('./testValues.json');

module.exports = (pluginInstance, options, services) => {
  if (options && options.FAIL_TEST_VALUE2)
    return Promise.reject(values.FAIL_TEST_VALUE2);
  return Promise.reject(values.FAIL_TEST_VALUE);
};
