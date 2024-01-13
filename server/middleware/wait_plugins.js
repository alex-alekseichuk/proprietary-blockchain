'use strict';

const logger = require("log4js").getLogger("wait_plugin");

module.exports = options => {
  return function waitPlugins(req, res, next) {
    logger.debug("wait plugins mixin");
    if (req.user || req.path.substr(0, 8) === '/images/')
      return next();
    res.status(434).sendFile('system_start.html', {
      root: __dirname
    });
  };
};
