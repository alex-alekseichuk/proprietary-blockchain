'use strict';
const fs = require('fs-extra');
const log4js = require('log4js');
const logger = log4js.getLogger('commands.copyright');

/**
 * creates all required files for starting the server
 * @param {object}  argv - The object instance of the type ARGV
 * @param {object}  result - The object instance of the result
 * @param {object}  i18n - The object instance of type i18n
 */
function command(argv, result, i18n) {
  logger.trace(i18n.__('executing :'));

  var copyright = (fs.readFileSync('./COPYRIGHT', 'utf-8'));
  logger.info(i18n.__(copyright));
  process.exit(0);
}

module.exports = command;
