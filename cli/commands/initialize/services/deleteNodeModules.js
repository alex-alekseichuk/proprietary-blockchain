'use strict';
const fs = require('fs-extra');
const logger = require('log4js').getLogger('commands.initialize.services.deleteNodeModules');

module.exports = configService => {
  logger.debug('commands.initialize.services.deleteNodeModules');

  return new Promise(function(resolve, reject) {
    logger.debug('0094 : Deleting in ./node_modules/ng-rt*');
    const glob = require('glob');
    const dirData = './node_modules/ng-rt*';
    const async = require('async');

    glob(dirData, function(err, matches) {
      if (matches.length > 0) {
        async.forEachOf(matches,
          function(item, m, callback2) {
            logger.debug('0095 : Found module %s ', item);

            fs.remove(item, function(err) {
              if (err) throw err;
              logger.debug('0096 : npm module %s deleted', item);
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
