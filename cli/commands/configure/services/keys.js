'use strict';
const logger = require('log4js').getLogger('commands.services.keys');
const keys = require('../../../../utils/keys.js');

module.exports = configService => {
  logger.debug('executing commands.services.keys');

  return new Promise((resolve, reject) => {
    var keypair = keys.generate_bs58();
    logger.info('Generated Public Key  : %s', keypair.pubkey);
    logger.info('Generated Private Key : %s', keypair.prvkey);

    configService.add("keypair", {
      public: keypair.pubkey,
      private: keypair.prvkey
    });
    return resolve(true);
  });
};
