'use strict';
const prompt = require("../../../prompt");
const bold = require("cli-colors").bold;
const logger = require('log4js').getLogger('commands.initialize.services.deleteConfirmDialog');

module.exports = configService => {
  logger.debug('commands.initialize.services.deleteConfirmDialog');
  return new Promise(function(resolve) {
    prompt.read({
      prompt: bold("Are you sure that you want to initialize the ENTIRE system (NO/YES)?:")
    }, function(err, answer) {
      if (err) {
        logger.error('Error :', err);
        process.exit(1);
      }
      if (answer === 'YES') {
        resolve();
      } else {
        logger.debug('NO');
        process.exit(0);
      }
    });
  });
};
