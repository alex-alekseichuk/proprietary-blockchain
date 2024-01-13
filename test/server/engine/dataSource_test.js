'use strict';
const chai = require('chai');
const assert = chai.assert;
const engineHelper = require('./helper');

describe.skip('ng_rt dataSource', () => {
  before(() => engineHelper.init());

  it('can connect to its mongodb', function(done) {
    assert.ok(engineHelper.app.dataSources);
    engineHelper.app.dataSources.ng_rt.connect(function(err) {
      if (err) return done(err);
      done();
    });
  });
});
