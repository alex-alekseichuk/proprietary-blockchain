'use strict';

const chai = require('chai');
const sinon = require('sinon');
chai.should();

const testData = require('../../../test/testData.js');

describe('test ', function() {
  const commandBeginBlock = require('./index.js');
  const commandCheckTx = require('./index.js');
  const commandCommit = require('./index.js');
  const commandDeliverTx = require('./index.js');
  const commandEcho = require('./index.js');
  const commandEndBlock = require('./index.js');
  const commandFlush = require('./index.js');
  const commandInitChain = require('./index.js');
  const commandQuery = require('./index.js');

  // setting up spies
  var commandBeginBlockExecSpy = sinon.spy(commandBeginBlock.exec);
  var commandCheckTxExecSpy = sinon.spy(commandCheckTx.exec);
  var commandCommitExecSpy = sinon.spy(commandCommit.exec);
  var commandDeliverTxExecSpy = sinon.spy(commandDeliverTx.exec);
  var commandEchoExecSpy = sinon.spy(commandEcho.exec);
  var commandEnddBlockExecSpy = sinon.spy(commandEndBlock.exec);
  var commandFlushExecSpy = sinon.spy(commandFlush.exec);
  var commandInitChainExecSpy = sinon.spy(commandInitChain.exec);
  var commandQueryExecSpy = sinon.spy(commandQuery.exec);

  beforeEach(() => {
    commandBeginBlockExecSpy.resetHistory();
    commandCheckTxExecSpy.resetHistory();
    commandCommitExecSpy.resetHistory();
    commandDeliverTxExecSpy.resetHistory();
    commandEchoExecSpy.resetHistory();
    commandEnddBlockExecSpy.resetHistory();
    commandFlushExecSpy.resetHistory();
    commandInitChainExecSpy.resetHistory();
    commandQueryExecSpy.resetHistory();
  });

  it('Is function BeginBlock.exec called once - false ', done => {
    commandBeginBlockExecSpy.called.should.be.false;
    done();
  });

  it('Is function BeginBlock.exec called once - true ', done => {
    commandBeginBlockExecSpy(testData.mockService, testData.stubRequest);
    commandBeginBlockExecSpy.called.should.be.true;
    done();
  });

  it('Is function checkTx.exec called once - false ', done => {
    commandCheckTxExecSpy.called.should.be.false;
    done();
  });

  it('Is function checkTx.exec called once - true ', done => {
    commandCheckTxExecSpy(testData.mockService, testData.stubRequest);
    commandCheckTxExecSpy.called.should.be.true;
    done();
  });

  it('Is function commit.exec called once - false ', done => {
    commandCommitExecSpy.called.should.be.false;
    done();
  });

  it('Is function deliverTx.exec called once - true ', done => {
    commandDeliverTxExecSpy(testData.mockService, testData.stubRequest);
    commandDeliverTxExecSpy.called.should.be.true;
    done();
  });
  it('Is function deliverTx.exec called once - false ', done => {
    commandDeliverTxExecSpy.called.should.be.false;
    done();
  });

  it('Is function commit.exec called once - true ', done => {
    commandEchoExecSpy(testData.mockService, testData.stubRequest);
    commandEchoExecSpy.called.should.be.true;
    done();
  });

  it('Is function endBlock.exec called once - true ', done => {
    commandEnddBlockExecSpy(testData.mockService, testData.stubRequest);
    commandEnddBlockExecSpy.called.should.be.true;
    done();
  });

  it('Is function endBlock.exec called once - false ', done => {
    commandEnddBlockExecSpy.called.should.be.false;
    done();
  });

  it('Is function flush.exec called once - true ', done => {
    commandFlushExecSpy(testData.mockService, testData.stubRequest);
    commandFlushExecSpy.called.should.be.true;
    done();
  });

  it('Is function flush.exec called once - false ', done => {
    commandFlushExecSpy.called.should.be.false;
    done();
  });

  it('Is function initChain.exec called once - true ', done => {
    commandInitChainExecSpy(testData.mockService, testData.stubRequest);
    commandInitChainExecSpy.called.should.be.true;
    done();
  });

  it('Is function initChain.exec called once - false ', done => {
    commandInitChainExecSpy.called.should.be.false;
    done();
  });

  it('Is function query.exec called once - true ', done => {
    commandQueryExecSpy(testData.mockService, testData.stubRequest);
    commandQueryExecSpy.called.should.be.true;
    done();
  });

  it('Is function query.exec called once - false ', done => {
    commandQueryExecSpy.called.should.be.false;
    done();
  });
});
