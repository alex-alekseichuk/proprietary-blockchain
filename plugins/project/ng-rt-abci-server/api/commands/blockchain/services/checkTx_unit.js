/**
 * Test abci transaction
 */
'use strict';

const sinonChai = require("sinon-chai");
const chai = require('chai');
chai.should();
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(sinonChai);
const sinon = require('sinon');
const testData = require('../../../../test/testData.js');
const fungibleData = require('../../../../test/fungibleAssets');
const proxyquire = require('proxyquire').noCallThru();
const {Base64} = require('js-base64');

var signaturestub;
var nodeCheckStub;
var init;

describe('abci backend', () => {
  let validateTxStub;
  beforeEach(() => {
    return new Promise(resolve => {
      signaturestub = sinon.stub().returns(true);
      validateTxStub = sinon.stub().returns(true);
      nodeCheckStub = sinon.stub().returns({
        code: 0,
        log: 'OK'
      });
      init = proxyquire('./checkTx', {
        'ng-signature/client/signature': {verifyBigchainDriverTx: signaturestub},
        './nodeRedCheckTx': {nodeRedCheck: nodeCheckStub},
        './validate': {validateTx: validateTxStub}
      });
      resolve();
    });
  });

  afterEach(() => {
  });

  it("Check Tx service", async () => {
    let res = Base64.decode(fungibleData.stubRequestabci.txPass);
    let buf = Buffer.from(res);
    let req = {tx: ''};
    req.tx = buf;
    const parsedTx = JSON.parse(req.tx.toString());
    let jsonResponse = await init(testData.services, parsedTx);
    jsonResponse.should.have.property('log').eql('OK');
    jsonResponse.should.have.property('code').eql(0);
  });

  it("Check config service prop", () => {
    let services = testData.services;
    let configService = services.get('configService');
    let configVerifySignature = configService.get("signatureVerifyABCIApp");
    configVerifySignature.should.be.eql(false);
  });

  it("fungible assets pass", async () => {
    let res = Base64.decode(fungibleData.stubRequestabci.txPass);
    let buf = Buffer.from(res);
    let req = {tx: ''};
    req.tx = buf;
    const parsedTx = JSON.parse(req.tx.toString());
    let jsonResponse = await init(fungibleData.services, parsedTx);
    jsonResponse.should.have.property('log').eql('OK');
    jsonResponse.should.have.property('code').eql(0);
  });

  it("fungible assets fail", async () => {
    let res = Base64.decode(fungibleData.stubRequestabci.txFail);
    let buf = Buffer.from(res);
    let req = {tx: ''};
    req.tx = buf;
    const parsedTx = JSON.parse(req.tx.toString());
    let jsonResponse = await init(fungibleData.services, parsedTx);
    jsonResponse.should.have.property('log').eql('asset hash verification failed');
    jsonResponse.should.have.property('code').eql(-1);
  });
});

describe('Plugin Settings', function() {
  let checkTxService;
  let nodeCheckStub;
  let signaturestub;
  let doubleSpendCheckStub;
  let validateTxStub;
  before(function() {
    signaturestub = sinon.stub().returns(true);
    validateTxStub = sinon.stub().returns(true);
    doubleSpendCheckStub = sinon.stub().resolves({
      code: 0,
      log: 'OK'
    });
    nodeCheckStub = sinon.stub().returns({
      code: 0,
      log: 'OK'
    });
    checkTxService = proxyquire('./checkTx', {
      'ng-signature/client/signature': {verifyBigchainDriverTx: signaturestub},
      './checkTxHook': {doubleSpendCheck: doubleSpendCheckStub},
      './nodeRedCheckTx': {nodeRedCheck: nodeCheckStub},
      './validate': {validateTx: validateTxStub}
    });
  });

  after(function() {
  });

  it.skip("VerifySignature set to TRUE: Returns valid response", async function() {
    let services = testData.services;
    let txReq = Base64.decode(fungibleData.stubRequestabci.txPass);
    let buf = Buffer.from(txReq);
    let req = {tx: ''};
    req.tx = buf;
    // verifySignature set to TRUE
    const parsedTx = JSON.parse(req.tx.toString());
    const res = await checkTxService(services, parsedTx);
    expect(res).to.have.property('code', 0);
    expect(res).to.have.property('log', 'OK');
  });

  it.skip("VerifySignature set to TRUE: Throws and returns failed code", async function() {
    let txReq = Base64.decode(fungibleData.stubRequestabci.txPass);
    let buf = Buffer.from(txReq);
    let req = {tx: ''};
    req.tx = buf;
    doubleSpendCheckStub.throws('Error', 'TransactionID matches a previous transaction');
    const failResponse = {
      code: -1,
      log: 'Failed'
    };
    let services = testData.services;
    const parsedTx = JSON.parse(req.tx.toString());
    const res = await checkTxService(services, parsedTx);
    expect(res).to.have.property('code', failResponse.code);
    expect(res).to.have.property('log', 'Failed');
  });

  // verifySignature set to FALSE
  it.skip("Returns valid response", async function() {
    let txReq = Base64.decode(fungibleData.stubRequestabci.txPass);
    let buf = Buffer.from(txReq);
    let req = {tx: ''};
    req.tx = buf;
    let services = testData.invalidServices;
    const parsedTx = JSON.parse(req.tx.toString());
    const res = await checkTxService(services, parsedTx);
    expect(res).to.have.property('code', 0);
    expect(res).to.have.property('log', 'OK');
  });
});
