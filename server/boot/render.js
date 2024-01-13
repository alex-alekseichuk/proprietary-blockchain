'use strict';

var path = require('path');
var fs = require('fs');

/**
 *
 * @param {*} name Name
 */
function req(name) {
  var module = require("./" + name);
  delete exports[name];
  exports[name] = module;
  return;
}

fs.readdirSync(__dirname).forEach(function(file) {
  if ((file === 'index.js') || (file[0] === '_')) {
    return;
  }
  var ext = path.extname(file);
  var stats = fs.statSync(path.resolve(__dirname, file));
  if (stats.isFile() && !(ext in require.extensions)) {
    return;
  }
  var basename = path.basename(file, '.js');
  exports.__defineGetter__(basename, function() {
    return req(basename);
  });
});
