'use strict';

const contextService = require('../context');
/**
 * function that generates an appender function
 * @param {function} layout log layout
 * @param {number} timezoneOffset timezone offset
 * @return {function} appender function
 */
function appender(layout, timezoneOffset) {
  // This is the appender function itself
  let log;
  let updating = false;
  let waiters = [];
  const getLogger = () => {
    return new Promise(async resolve => {
      if (log && !updating)
        return resolve();
      log = require('loopback').findModel('log');
      if (log && !updating) {
        updating = true;
        await log.dataSource.autoupdate('log');
        updating = false;
        waiters.forEach(f => f());
        return resolve();
      }
      waiters.push(resolve);
    });
  };

  return loggingEvent =>
    getLogger().then(() => {
      return log.create({
        level: loggingEvent.level.level,
        levelStr: loggingEvent.level.levelStr,
        categoryName: loggingEvent.categoryName,
        data: loggingEvent.data,
        startTime: loggingEvent.startTime,
        clientId: contextService.get('clientId') || '-',
        sessionId: contextService.get('sessionId') || '-'
      });
    });
}

/**
 * configure doesn't need to use findAppender, or levels
 * @param {object} config appender config
 * @param {object} layouts appender layouts
 * @return {function} return appender function
 */
function configure(config, layouts) {
  // the default layout for the appender
  let layout = layouts.colouredLayout;
  // check if there is another layout specified
  if (config.layout) {
    // load the layout
    layout = layouts.layout(config.layout.type, config.layout);
  }
  // create a new appender instance
  return appender(layout, config.timezoneOffset);
}

// export the only function needed
exports.configure = configure;
