'use strict';

const chai = require('chai');
const sinon = require('sinon');
chai.should();

const testData = require('../../../../test/testData.js');

describe('End Block Testing ', function() {
  const endBlock1 = require('./endBlock');
  const endBlockSpy = sinon.spy(endBlock1);
  beforeEach(() => {
    endBlockSpy.resetHistory();
  });

  it('Function returns normal response', async () => {
    const response = await endBlockSpy(testData.services, testData.stubEndBlockRequest, []);
    response.should.have.property('code').eql(0);
    response.should.have.property('log').eql('End Block Done');
    response.should.not.have.property('validatorUpdates');
  });

  it('Function returns validatorUpdates object', async () => {
    const response = await endBlockSpy(testData.services, testData.stubEndBlockValRequest, testData.tnChainInfoDataInitChain.validators);
    response.should.have.property('code').eql(0);
    response.should.have.property('log').eql('End Block Done');
    response.should.have.property('validatorUpdates');
  });
});
