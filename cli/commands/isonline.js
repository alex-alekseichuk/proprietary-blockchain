'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('commands.isonline');

/**
 * creates all required files for starting the server
 * @param {object}  argv - The object instance of the type ARGV
 * @param {object}  result - The object instance of the result
 * @param {object}  i18n - The object instance of type i18n
 */
function command(argv, result, i18n) {
  logger.trace(i18n.__('executing :'));

  var isOnline = require('is-online');
  isOnline(function(err, online) {
    if (err) {
      logger.info(i18n.__('Error :', err));
    } else if (online === true) {
      logger.info(i18n.__('Server connection to the Internet established'));
    } else {
      logger.info(i18n.__('Server has NO connection to the Internet'));
    }
  });
}
module.exports = command;
