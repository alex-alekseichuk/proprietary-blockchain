/**
 * Test abci transaction
 */
'use strict';

const sinonChai = require("sinon-chai");
const chai = require('chai');
chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;
const testData = require('../../../../test/testData.js');
const proxyquire = require('proxyquire').noCallThru();

const sinon = require('sinon');
// const commit = require('./commit');

describe('abci backend', () => {
  var tmBlock;
  var toCall;
  beforeEach(() => {
    tmBlock = sinon.stub().resolves(testData.tmLatestBlockInformation);
    toCall = proxyquire('./commit', {
      '../dataService/tmLatestBlockInformationDS': {findLatestBlock: tmBlock,
        writeLatestBlockInfo: tmBlock}
    });
  });

  afterEach(() => {
    tmBlock.reset();
  });

  it("Commit Tx service new block", async () => {
    await toCall(testData.services, testData.stubRequest, testData.tnBlockData, testData.tmLatestBlockInformation, testData.tnBlockData.transactions);
    expect(tmBlock).to.have.been.calledOnce;
  });

  it.skip("Commit Tx service existing block ", async () => {
    await toCall(testData.services, testData.stubRequest, testData.tnBlockData, testData.tmLatestBlockInformation, '');
    expect(tmBlock).to.have.been.calledOnce;
  });
});
