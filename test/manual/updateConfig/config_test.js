'use strict';
const helper = require('./helper');
require('chai').should();

/**
 You should to put environment autoUpdate (inverted from config.json) before run this test.
 Warning: By default this test will be invert autoUpdate field before each run test, it's only for internal config.json
**/

describe('Update config with process.env', () => {
  before(async() => {
    await helper.restoreDefaultConfig();
  });

  it('should be update field "autoUpdate" to $process.env.autoUpdate', async() => {
    const fieldFromConfig = helper.configGet('autoUpdate:active');
    let invertedFieldFromConfig = !((fieldFromConfig == 'true' || fieldFromConfig == true));
    if (typeof (process.env.autoUpdate) === 'undefined') {
      throw new Error('autoUpdate env is missing');
    }
    await helper.configUpdate();
    try {
      let fieldAutoUpdate = helper.configGet('autoUpdate:active');
      if (typeof (fieldAutoUpdate) === 'undefined') {
        throw new Error('field is not exist');
      }
      fieldAutoUpdate = (fieldAutoUpdate == 'true' || fieldAutoUpdate == true);
      fieldAutoUpdate.should.be.equal(invertedFieldFromConfig);
    } catch (e) {
      throw (e);
    }
  });
});
