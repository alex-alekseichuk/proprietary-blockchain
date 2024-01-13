/**
 * Test abci transaction
 */
"use strict";

const sinonChai = require("sinon-chai");
const chai = require("chai");
chai.should();
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;
const dataHandler = require("./dataHandler");
const testData = require("../../../../test/testData.js");
const testTransaction = require("../../../../test/testTransaction");

describe("dataHandler", () => {
  beforeEach(() => {});

  it("Should have property", function() {
    dataHandler.should.have.property("createValidator");
    dataHandler.should.have.property("compose");
    dataHandler.should.have.property("update");
    dataHandler.should.have.property("deleteAllData");
    dataHandler.should.have.property("deletebyID");
    dataHandler.should.have.property("findOne");
    dataHandler.should.have.property("create");
    dataHandler.should.have.property("updateValidator");
    dataHandler.should.have.property("find");
    dataHandler.should.have.property("deleteByFilter");
  });
  it("createValidator", async () => {
    let response = await dataHandler.createValidator(
      testData.services.get("loopbackApp").models.validatorSet,
      testData.tnChainInfoDataInitChain.validators
    );
    expect(response[0]).to.have.property("power");
    expect(response[0]).to.have.property("pubKey");
  });
  it("updateValidator", async () => {
    let response = await dataHandler.createValidator(
      testData.services.get("loopbackApp").models.validatorSet,
      testData.tnChainInfoDataInitChain.validators
    );
    expect(response[0]).to.have.property("power");
    expect(response[0]).to.have.property("pubKey");
  });
  it("findOne", async () => {
    let response = await dataHandler.findOne(
      testData.services.get("loopbackApp").models.validatorSet,
      "test"
    );
    expect(response).to.be.deep.equal("found key");
  });

  it("create", async () => {
    let response = await dataHandler.create(
      testData.services.get("loopbackApp").models.tmTx, testTransaction.txCreate.tx
    );
    expect(response).to.be.deep.equal("654a91342102379f362a8f447b76d8f7f3a06413e66c959495fa28e55d9795e5");
  });

  it('compose', async function() {
    let response = await dataHandler.compose(testTransaction.txCreate);
    expect(response).to.have.property('tmTx');
    expect(response.tmTx).to.have.property('txId').eql('654a91342102379f362a8f447b76d8f7f3a06413e66c959495fa28e55d9795e5');
    expect(response.tmTx).to.have.property('txData');
    expect(response.tmTx).to.have.property('txMetadata');
    expect(response).to.have.property('tmAsset');
    expect(response).to.have.property('tmMetadata');
    expect(response).to.have.property('txInput');
    expect(response).to.have.property('txOutput');
  });

  it("find", async () => {
    let response = await dataHandler.find(
      testData.services.get("loopbackApp").models.tmTx
    );
    expect(response.length).to.be.equal(1);
    expect(response[0]).to.have.property('txId').equal('551933529ab379873fce6116038a5a42c594682372e32a2166c2994fa6755ccc');
    expect(response[0]).to.have.property('operation').equal('TRANSFER');
    expect(response[0]).to.have.property('inputs');
    expect(response[0]).to.have.property('outputs');
    expect(response[0]).to.have.property('metadata');
    expect(response[0]).to.have.property('asset');
    expect(response[0]).to.have.property('version');
  });
});
