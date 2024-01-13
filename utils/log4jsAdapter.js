/**
 * ng-common logger interface implemented by log4js.
 * It's used as logger dependency for ng-common modules in ng-rt-core.
 * @requires log4js
 */
'use strict';
const log4js = require('log4js');
module.exports = {
  get: path => log4js.getLogger(path)
};
