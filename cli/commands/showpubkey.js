'use strict';
const configService = require('ng-configservice');
const log4js = require('log4js');
const logger = log4js.getLogger('commands.showpubkey');
configService.read('config/server/config.json');
/**
 * creates all required files for starting the server
 * @param {object}  argv - The object instance of the type ARGV
 * @param {object}  result - The object instance of the result
 * @param {object}  i18n - The object instance of type i18n
 */
function command(argv, result, i18n) {
  logger.trace(i18n.__('executing :'));

  logger.info(i18n.__('The servers public key is : %s', configService.get("keypair:public")));
}

module.exports = command;
