'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('commands.stop');

/**
 * creates all required files for starting the server
 * @param {object}  argv - The object instance of the type ARGV
 * @param {object}  result - The object instance of the result
 * @param {object}  i18n - The object instance of type i18n
 */
function command(argv, result, i18n) {
  logger.trace(i18n.__('executing :'));

  const exec = require('child_process').exec;
  const SPACE = ' ';

  exec('ps aux | grep node', (err, stdout, stderr) => {
    if (err !== null) {
      return logger.info(`exec error: ${err}`);
    }

    var data = stdout.toString().split('\n');

    data.forEach(log => {
      if (log.endsWith('node .')) {
        var pid = getSvrPid(log);
        logger.trace(i18n.__('pid :', pid));
        exec(`kill -9 ${pid}`, (err, stdout, stderr) => {
          if (err !== null) {
            return logger.info(`exec error: ${err}`);
          }
          logger.info(i18n.__(`killed process: ${stdout}`));
        });
      }
    });
  });

  /**
   * Get the Process ID pid out of the string
   * @param  {string} log representation of the logline
   * @return {string} pid Process ID
   */
  function getSvrPid(log) {
    var pid = -1;
    for (var i = 0; i < log.length; i++) {
      if (pid === -1) { // skip username
        if (log[i] === SPACE) pid = 0;
      } else if (pid === 0) { // skip space
        if (log[i] !== SPACE) pid = log[i];
      } else {
        if (log[i] === SPACE) break;
        pid += log[i];
      }
    }
    return pid;
  }
  process.exit(0);
}

module.exports = command;
