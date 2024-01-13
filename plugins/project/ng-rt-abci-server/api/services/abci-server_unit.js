'use strict';

const sinonChai = require("sinon-chai");
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const {Base64} = require('js-base64');
chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.should();
// const assert = chai.assert;
const expect = chai.expect;

const mockery = require('mockery');
const sinon = require('sinon');
// const sinon = require('sinon');
// const proxyquire = require('proxyquire').noCallThru();
// const abciServer = require('./abci-server');

const testData = require('../../test/testData.js');
// var deletestub;
mockery.enable({
  warnOnReplace: false,
  warnOnUnregistered: false,
  useCleanCache: true
});
let abciServer;
let commands;
describe('abci-server ', function() {
  beforeEach(() => {
    commands =
    {
      commit: {
        exec: sinon.stub().withArgs(testData.services, testData.stubRequest, testData.tnBlockData.blocks, testData.tmLatestBlockInformation.blocks, testData.tnBlockData.transactions)
                        .returns({
                          code: 0,
                          log: "test Commit succeeded"
                        })
                        .withArgs().throws()
                        .withArgs(sinon.match.any).returns({
                          code: 0,
                          log: "test Commit succeeded"
                        })
      },

      checkTx: {
        exec: sinon.stub().withArgs(testData.services, testData.stubRequest)
                        .returns({
                          code: 0,
                          log: 'OK '
                        })
      },
      deliverTx: {
        exec: sinon.stub().withArgs(testData.services, testData.stubDeliverTxRequest)
                        .returns({deliverTxRes: {Code: 0,
                          Log: 'DeliverTx Done'}})
      },
      endBlock: {
        exec: sinon.stub().withArgs(testData.services, testData.stubEndBlockRequest)
        .returns({
          Code: 0,
          Log: 'End Block Done'
        })
      },
      echo: {
        exec: sinon.stub().withArgs(testData.services, testData.stubRequest)
                        .returns({
                          code: 0,
                          log: 'Echo executed'
                        })
      },
      flush: {
        exec: sinon.stub()
      },
      beginBlock: {
        exec: sinon.stub().withArgs(testData.services, testData.stubRequest)
                        .returns({
                          block: 'block',
                          tmLatestBlock: 'tmLatestBlock'
                        })
      }

    };
    mockery.registerMock('../commands/blockchain', commands);
    abciServer = require('./abci-server');
  });

  afterEach(() => {
    mockery.deregisterMock('../commands/blockchain');
    commands.commit.exec.reset();
  });

  it("property check function - true", done => {
    let response = abciServer(testData.services, testData.pluginInstance);
    expect(response.serverHandlers).to.have.property('beginBlock');
    expect(response.serverHandlers).to.have.property('checkTx');
    expect(response.serverHandlers).to.have.property('commit');
    expect(response.serverHandlers).to.have.property('endBlock');
    expect(response.serverHandlers).to.have.property('echo');
    expect(response.serverHandlers).to.have.property('flush');
    expect(response.serverHandlers).to.have.property('info');
    expect(response.serverHandlers).to.have.property('initChain');
    expect(response.serverHandlers).to.have.property('query');
    done();
  });

  it("server commit function - true", async() => {
    let response = abciServer(testData.services, testData.pluginInstance);
    let jsonResponse = await response.serverHandlers.commit(testData.stubRequest);
    jsonResponse.should.have.property('log').eql('test Commit succeeded');
    jsonResponse.should.have.property('code').eql(0);
    // let temp = await response.serverHandlers.commit();
  });

  it("server checkTx function - true", async() => {
    let response = abciServer(testData.services, testData.pluginInstance);
    let res = Base64.decode(testData.stubRequest.tx);
    let buf = Buffer.from(res);
    let req = {tx: ''};
    req.tx = buf;
    let jsonResponse = await response.serverHandlers.checkTx(req);
    jsonResponse.should.have.property('log').eql('OK ');
    jsonResponse.should.have.property('code').eql(0);
  });

  it.skip("server deliverTx function - true", async() => {
    let response = abciServer(testData.services, testData.pluginInstance);
    let jsonResponse = await response.serverHandlers.deliverTx(testData.services, testData.stubDeliverTxRequest, []);
    jsonResponse.should.have.property('Log').eql('DeliverTx Done');
    jsonResponse.should.have.property('Code').eql(0);
  });

  it("server endBlock function - true", async () => {
    let response = abciServer(testData.services, testData.pluginInstance);
    let jsonResponse = await response.serverHandlers.endBlock(testData.services, testData.stubEndBlockRequest);
    jsonResponse.should.have.property('Log').eql('End Block Done');
    jsonResponse.should.have.property('Code').eql(0);
  });

  it("server echo function - true", async() => {
    let response = abciServer(testData.services, testData.pluginInstance);
    let jsonResponse = await response.serverHandlers.echo(testData.stubRequest);
    jsonResponse.should.have.property('log').eql('echo succeeded');
    jsonResponse.should.have.property('code').eql(0);
  });

  it("server flush function - true", async() => {
    let response = abciServer(testData.services, testData.pluginInstance);
    let jsonResponse = await response.serverHandlers.flush(testData.stubRequest);
    jsonResponse.should.have.property('log').eql('flush succeeded');
    jsonResponse.should.have.property('code').eql(0);
  });

  it("server beginBlock function - true", async() => {
    let response = abciServer(testData.services, testData.pluginInstance);
    let jsonResponse = await response.serverHandlers.beginBlock(testData.stubRequest);
    jsonResponse.should.have.property('log').eql('Begin block');
    jsonResponse.should.have.property('code').eql(0);
  });
});
