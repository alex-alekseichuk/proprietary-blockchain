/**
* Test abci transaction
*/
'use strict';

const chai = require('chai');
const assert = require('chai').assert;
const sinon = require('sinon');
chai.should();
const testData = require('../../../../test/testData.js');
const testTransaction = require('../../../../test/testTransaction.js');
const proxyquire = require('proxyquire').noCallThru();
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

describe('DeliverTx backend', () => {
  var validatorUpdateStub;
  var doubleSpendCheckStub;
  var toCall;
  var composeStub;
  let createStub;
  let validateTxStub;
  const composeTxs = {
    tmTx: 'tmTx',
    tmAsset: 'tmAsset',
    tmMetadata: 'tmMetadata',
    txInput: [{inputs: 'inputs'}],
    txOutput: [{outputs: 'outputs'}]
  };
  before(() => {
    createStub = sinon.stub().returns('done');
    composeStub = sinon.stub().returns(composeTxs);
    validateTxStub = sinon.stub().returns(true);
    doubleSpendCheckStub = sinon.stub().returns({
      code: 0,
      log: 'OK'
    });
    validatorUpdateStub = sinon.stub().returns({
      PubKey: {
        Type: "ed25519",
        Data: "testData"
      },
      Power: 10
    });
    toCall = proxyquire('./deliverTx', {
      './doubleSpend': {check: doubleSpendCheckStub},
      '../dataService/dataHandler': {create: createStub, compose: composeStub},
      '../utils/validatorUpdate': {validatorUpdate: validatorUpdateStub},
      './validate': {validateTx: validateTxStub}
    });
  });

  after(() => {
  });

  it("Deliver Tx service - Normal Request", async () => {
    let data = testTransaction.txCreate;
    let deliverTxResponse = await toCall(testData.services, data);
    deliverTxResponse.should.not.to.be.empty;
  });

  it("Deliver Tx service -  ", async () => {
    let data = testTransaction.txCreate;
    let deliverTxResponse = await toCall(testData.services, data);
    deliverTxResponse.should.have.property('deliverTxRes');
    deliverTxResponse.should.not.have.property('validator');
    deliverTxResponse.deliverTxRes.should.have.property('code').eql(0);
    deliverTxResponse.deliverTxRes.should.have.property('log').eql('DeliverTx Done');
    deliverTxResponse.deliverTxRes.should.have.property('data');
  });

  it("Deliver Tx service - Validator Update Request", async () => {
    let data = testData.valUpdateReq;
    let deliverTxResponse = await toCall(testData.services, data);
    deliverTxResponse.should.have.property('deliverTxRes');
    deliverTxResponse.deliverTxRes.should.have.property('code').eql(0);
    deliverTxResponse.deliverTxRes.should.have.property('log').eql('DeliverTx Done');
    deliverTxResponse.deliverTxRes.should.have.property('data');
    deliverTxResponse.should.have.property('validator');
  });

  describe('Failed/Invalid Txs processing', () => {
    let data = testTransaction.txCreate;
    const txIdMatchErr = 'TransactionID matches a previous transaction';
    var fakeCheckThrows = sinon.fake.throws(new Error(txIdMatchErr));
    before(() => {
      toCall = proxyquire('./deliverTx', {
        './validate': {validateTx: fakeCheckThrows}
      });
    });

    after(() => {
      sinon.restore();
    });

    it('Logs error when CheckTx throws Error ', async () => {
      await expect(toCall(testData.services, data)).to.be.rejected;
    });
  });

  describe('DeliverTx Plugin Settings', () => {
    let data = testTransaction.txCreate;
    before(() => {
      toCall = proxyquire('./deliverTx', {
        './validate': {validateTx: validateTxStub},
        '../dataService/dataHandler': {create: createStub, compose: composeStub}
      });
    });
  // DeliverTx set to TRUE
    describe('DeliverTx settings: Set to TRUE', () => {
      let services = testData.services;
      it("Returns valid response", async () => {
        const res = await toCall(services, data);
        assert.typeOf(res, 'object');
        expect(res).to.have.property("deliverTxRes");
        expect(res.deliverTxRes).to.have.property('code', 0);
        expect(res.deliverTxRes).to.have.property('log', 'DeliverTx Done');
        expect(res.deliverTxRes).to.have.property('data');
      });

      it("Throws and returns failed code", async () => {
        validateTxStub.throws('TransactionID matches a previous transaction');
        await expect(toCall(services, data)).to.be.rejected;
      });
    });

    // DeliverTx set to FALSE
    describe('DeliverTx settings: Set to FALSE', () => {
      let services = testData.invalidServices;
      it("Returns valid response", async () => {
        const res = await toCall(services, data);
        expect(res.deliverTxRes).to.have.property('code', 0);
        expect(res.deliverTxRes).to.have.property('log', 'DeliverTx Done');
      });

      it("Throws and returns failed code", async () => {
        let services = testData.invalidServices;
        createStub.throws('Create failed');
        await expect(toCall(services, data)).to.be.rejected;
      });
    });
  });
});
