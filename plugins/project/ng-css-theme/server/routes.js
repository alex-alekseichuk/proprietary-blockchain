/**
 * HTTP Route for serving ng-rt-admin themes
 */
'use strict';

const logger = require('log4js').getLogger('ng-css-theme.routes');
const path = require('path');
const StatsD = require('hot-shots');
const statsd = new StatsD({
  host: (process.env.ngrtStatsdHost || '127.0.0.1'),
  port: (process.env.ngrtStatsdPort || '8125'),
  errorHandler: error => logger.error('StatsD exception:', error.message)
});

/**
 * API/Route/themes
 *
 * @module API/Route/themes
 * @type {Object}
 */
module.exports = {
  activate: (loopbackApp, plugin, pluginInstance) => {
    logger.info('themes');
    logger.info(path.resolve(__dirname, '../client/themes'));
    loopbackApp.use(`/themes/project.com`, loopbackApp.loopback.static(path.resolve(__dirname, '../client/themes/project.com')));
    loopbackApp.use(`/themes/dev-2.0.project.com`, loopbackApp.loopback.static(path.resolve(__dirname, '../client/themes/dev-2.0.project.com')));
    statsd.increment(`routes, route=/themes, type=use`);
  },
  deactivate: {
    static: {path: "/themes"}
  }
};
