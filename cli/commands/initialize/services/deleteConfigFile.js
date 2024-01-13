'use strict';

const fs = require('fs-extra');
const logger = require('log4js').getLogger('commands.initialize.services.deleteConfigFile');

module.exports = configService => {
  logger.debug('commands.initialize.services.deleteConfigFile');
  return new Promise(function(resolve, reject) {
    logger.debug('0094 : Deleting configurations');
    const glob = require('glob');
    const async = require('async');
    const pattern = "config/**";
    const options = {
      ignore: ['config', 'config/licenses', 'config/licenses/**/*']
    };
    glob(pattern, options, function(err, matches) {
      if (matches.length > 0) {
        async.forEachOf(matches,
          function(item, m, callback2) {
            fs.remove(item, function(err) {
              if (err) throw err;
              callback2();
            });
          },
          function() {
            return resolve(null);
          });
      } else {
        return resolve(null);
      }
    });
  });
};
