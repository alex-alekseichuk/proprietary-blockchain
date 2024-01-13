'use strict';

const chai = require('chai');
const sinon = require('sinon');
// const expect = chai.expect;
chai.should();

const testData = require('../../../../test/testData.js');

describe('test ', function() {
  const query1 = require('./query');
  var spy1 = sinon.spy(query1);
  beforeEach(() => {
    spy1.resetHistory();
  });

  it('Is function query called once - false ', function() {
    spy1.called.should.be.false;
  });

  it('Is function query called once - true ', function() {
    spy1(testData.mockService, testData.stubRequest);
    spy1.called.should.be.true;
  });
});
