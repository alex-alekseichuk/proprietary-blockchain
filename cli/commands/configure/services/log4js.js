'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('log4js').getLogger('commands.services.log4js');
const config = '../../../../config/server';
const fileExists = require('file-exists');

module.exports = configService => {
  logger.debug('executing commands.services.log4js');

  return new Promise((resolve, reject) => {
    // path to log4js path
    const log4jsFileName = 'log4js.json';
    const log4jsPath = path.join(__dirname, config, log4jsFileName);
    if (!fileExists.sync(log4jsPath)) {
      const log4js = {
        appenders: {
          app: {
            type: "dateFile",
            filename: "log/app.log",
            pattern: ".yyyy-MM-dd-hh",
            daysToKeep: 10,
            compress: true
          },
          errorFile: {
            type: "file",
            filename: "log/error.log",
            maxLogSize: 10485760,
            numBackups: 5,
            compress: true
          },
          errors: {
            type: "logLevelFilter",
            level: "ERROR",
            appender: "errorFile"
          },
          warnFile: {
            type: "file",
            filename: "log/warn.log",
            maxLogSize: 10485760,
            numBackups: 5,
            compress: true
          },
          warnings: {
            type: "logLevelFilter",
            level: "WARN",
            appender: "warnFile"
          },
          console: {
            type: "console"
          },
          loopbackAppender: {
            type: "server/backend/appenders/loopbackAppender"
          }
        },
        categories: {
          default: {
            appenders: [
              "console", "app", "errors", "warnings", "loopbackAppender"
            ],
            level: "debug"
          }
        },
        client: {
          prefix: "C/",
          level: "all",
          appenders: [
            {
              type: "browser-console"
            },
            {
              type: "ajax",
              url: "/ng-rt-core/log",
              threshold: 5,
              timeout: 2000
            }
          ]
        }
      };
      fs.writeFileSync(log4jsPath, JSON.stringify(log4js, null, 2));
    }
    return resolve(true);
  });
};
