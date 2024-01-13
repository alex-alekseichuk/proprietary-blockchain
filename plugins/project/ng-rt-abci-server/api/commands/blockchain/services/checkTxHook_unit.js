'use strict';
const chai = require('chai');
chai.should();

describe('CheckTxHook ', function() {
  const checkTxHook = require('./checkTxHook');
  it("Should have property", function() {
    checkTxHook.should.have.property('smartContractsCheck');
  });
});
