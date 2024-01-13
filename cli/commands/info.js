'use strict';

const os = require("os");
const log4js = require('log4js');
const logger = log4js.getLogger('commands.info');

/**
 * creates all required files for starting the server
 * @param {object}  argv - The object instance of the type ARGV
 * @param {object}  result - The object instance of the result
 * @param {object}  i18n - The object instance of type i18n
 */
function command(argv, result, i18n) {
  logger.trace(i18n.__('executing :'));

  logger.info(i18n.__('Hostname : %s', os.hostname()));
  logger.info(i18n.__('Type : %s', os.type()));
  logger.info(i18n.__('Platform : %s', os.platform()));
  logger.info(i18n.__('Release : %s', os.release()));
  logger.info(i18n.__('Uptime : %s', os.uptime()));
  logger.info(i18n.__('Free Memory : %s', os.freemem()));
  logger.info(i18n.__('Total Memory : %s', os.totalmem()));
  logger.info(i18n.__('CPUs : %s', os.cpus().length));

  let interfaces = os.networkInterfaces();
  let addresses = [];
  for (let k in interfaces) {
    if (interfaces.hasOwnProperty(k)) {
      for (let k2 in interfaces[k]) {
        if (interfaces[k].hasOwnProperty(k2)) {
          let address = interfaces[k][k2];
          if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
          }
        }
      }
    }
  }
  logger.info(i18n.__('Network Interfaces : %s', addresses));
  logger.info(i18n.__('Endianess : %s', os.endianness()));
}

module.exports = command;
