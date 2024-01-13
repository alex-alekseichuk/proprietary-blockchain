'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('log4js').getLogger('commands.services.component_config');

const server = '../../../../server';

module.exports = configService => {
  logger.debug('executing commands.services.component_config');
  return new Promise((resolve, reject) => {
    var componentConfig = {
    };

    fs.writeFileSync(path.join(__dirname, server, "component-config.json"), JSON.stringify(componentConfig, null, 2));
    return resolve(true);
  });
};
