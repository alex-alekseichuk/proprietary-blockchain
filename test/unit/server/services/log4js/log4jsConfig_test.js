'use strict';
const helper = require('./helper');
require('chai').should();

describe('Update log4js config with process.env', () => {
  before(() => helper.restoreDefaultConfig());

  it('should be update field "level" to $process.env.serverLogLevel', () => {
    let originalEnv = process.env.serverLogLevel;
    process.env.serverLogLevel = 'info';
    helper.init();
    const level = helper.getLevelField();
    (process.env.serverLogLevel).should.be.equal(level);
    process.env.serverLogLevel = originalEnv;
  });
});
