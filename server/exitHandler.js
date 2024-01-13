"use strict";
const logger = require('log4js').getLogger('exitHandler.js');

module.exports = (stopExit, i18n) => {
  let exitListener;
  process.removeAllListeners('uncaughtException');
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGUSR1');
  process.removeAllListeners('SIGUSR2');

  /**
   * handler for process exit
   * @param {bool} exit if true process will be exited
   */
  async function exitHandler(exit) {
    if (exitListener && typeof exitListener === 'function')
      await exitListener();
    if (exit && !stopExit)
      process.exit();
  }

  process.on('uncaughtException', async err => {
    if (i18n)
      logger.error(i18n.__('UncaughtException: %s', err.stack ? err.stack : (err.message ? err.message : err)));
    exitHandler(false);
  });
  process.on('SIGINT', exitHandler.bind(null, true));
  if (process.env.PROFILE) {
    const fs = require('fs');
    const moment = require('moment');
    const profiler = require('v8-profiler-node8');
    let _profiling;
    process.on('SIGUSR1', function() {
      if (_profiling) {
        logger.debug('stop profiling');
        const profile = profiler.stopProfiling(_profiling);
        const filename = `profile-${_profiling}.json`;
        _profiling = null;
        profile.export(function(error, result) {
          fs.writeFileSync(filename, result);
          profile.delete();
          profiler.deleteAllProfiles();
        });
      } else {
        _profiling = moment().format('YYYYMMDDhhmmss');
        logger.debug(`start profiling ${_profiling}`);
        profiler.startProfiling(_profiling);
      }
    });
  } else {
    process.on('SIGUSR1', exitHandler.bind(null, true));
  }
  process.on('SIGUSR2', exitHandler.bind(null, true));

  return callback => {
    exitListener = callback;
  };
};
