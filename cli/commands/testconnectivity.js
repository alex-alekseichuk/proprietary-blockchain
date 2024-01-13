'use strict';

const connectivityService = require('../../server/backend/connectivityService');
/**
 * creates all required files for starting the server
 * @param {object}  argv - The object instance of the type ARGV
 * @param {object}  result - The object instance of the result
 * @param {object}  i18n - The object instance of type i18n
 * @return {object}        just process.exit()
 */
function command(argv, result, i18n) {
  return connectivityService.check(argv, i18n)
    .then(() => {
      process.exit(0);
    });
}

module.exports = command;
