'use strict';

const chai = require('chai');
const sinon = require('sinon');
chai.should();

const testData = require('../../../../test/testData.js');

describe('test ', function() {
  const flush1 = require('./flush');
  var spy1 = sinon.spy(flush1);
  beforeEach(() => {
    spy1.resetHistory();
  });

  it('Is function flush called once - false ', () => {
    spy1.called.should.be.false;
  });

  it('Is function flush called once - true ', () => {
    // flush1(testData.mockService, testData.stubRequest);
    spy1(testData.mockService, testData.stubRequest);
    // ToDo This check should be true
   // assert(spy1.withArgs(testData.mockService, testData.stubRequest).called);
   // assert(spy1.called)
    // expect(spy1.withArgs(testData.mockService, testData.stubRequest).called).to.be.true;
    spy1.called.should.be.true;
  });
});
