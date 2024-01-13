'use strict';

const logger = require("log4js").getLogger("wait_plugin");

const checkReq = req => {
  if (!req.app.plugin_manager)
    return;
  if (!req.app.plugin_manager.mandatoryReady)
    return;
  return true;
};

module.exports = options => {
  logger.debug('executing options');
  return function waitPlugins(req, res, next) {
    if (checkReq(req) || req.path.substr(0, 8) === '/images/')
      return next();
    res.status(434).sendFile('system_start.html', {
      root: __dirname
    });
  };
};
