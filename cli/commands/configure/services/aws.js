'use strict';

const logger = require('log4js').getLogger('commands.services.aws');
const fs = require('fs');
const path = require('path');

module.exports = configService => {
  logger.debug('executing commands.services.aws');

  return new Promise((resolve, reject) => {
    var licenseFilePath = path.resolve(__dirname, '../../../../', 'config', 'licenses', 'ng-rt-core.lic');

    try {
      var data = fs.readFileSync(licenseFilePath, 'utf8');
      let dataLines = data.split('\n');

      let id = dataLines[26];
      let key = dataLines[27];
      let region = dataLines[28];

      configService.add("aws", {
        id,
        key,
        region
      });
      logger.trace('aws:id  : %s', id);
      logger.trace('aws:key : %s', key);
      logger.trace('aws.region : %s', region);

      // The AWS S3 SDK expects the credentials in process.env variables
      if (!process.env.AWS_ACCESS_KEY_ID && id)
        process.env.AWS_ACCESS_KEY_ID = id;
      if (!process.env.AWS_SECRET_ACCESS_KEY && key)
        process.env.AWS_SECRET_ACCESS_KEY = key;
      if (!process.env.AWS_REGION && region)
        process.env.AWS_REGION = region;
      return resolve(true);
    } catch (e) {
      logger.error('Error:', e.message);
    }
  });
};
