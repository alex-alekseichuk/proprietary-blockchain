'use strict';

const fs = require('fs');
const path = require('path');
const server = "../../../../server";
const logger = require('log4js').getLogger('commands.services.server_config');

module.exports = configService => {
  logger.debug('executing commands.services.server_config');

  return new Promise((resolve, reject) => {
    var config = {
      restApiRoot: "/api",
      host: "0.0.0.0",
      port: configService.get('ngrtPort'),
      logoutSessionsOnSensitiveChanges: true,
      cookieSecret: "a567a01d-zu76-98kk-8099-dg6cb3cdlld0",
      remoting: {
        context: {
          enableHttpContext: true
        },
        rest: {
          normalizeHttpPath: false,
          xml: false
        },
        json: {
          strict: false,
          limit: "100kb"
        },
        urlencoded: {
          extended: true,
          limit: "100kb"
        },
        cors: false,
        errorHandler: {
          debug: false
        }
      },
      legacyExplorer: false
    };

    fs.writeFileSync(path.join(__dirname, server, "config.json"), JSON.stringify(config, null, 2));
    return resolve(true);
  });
};
