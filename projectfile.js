'use strict';

module.exports = {
  beforeCommandRun() {
    global.appBase = __dirname; // root path for ng-rt
  }
};
