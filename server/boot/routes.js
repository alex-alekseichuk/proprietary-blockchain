'use strict';

var glob = require('glob');
var _ = require('underscore');

module.exports = (server, cb) => {
  if (server.serviceMode)
    return cb();
  // Setup routes
  var routers = glob.sync('../routes/*.js', {cwd: __dirname, realpath: true})
    .map(filename => require(filename))
    .filter(router => typeof router === 'function');

  _.sortBy(routers, router => router.order || 0)
    .forEach(router => router(server));
  cb();
};
