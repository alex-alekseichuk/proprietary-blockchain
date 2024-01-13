'use strict';

const sinonChai = require("sinon-chai");
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(sinonChai);
// const assert = chai.assert;
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const testData = require('../../../../test/testData.js');
let deleteDS;
let toCall;
let tmChainInfoDS;
let dataHandlerDS;

describe('initChain ', function() {
  beforeEach(() => {
    deleteDS = sinon.stub().resolves(true);
    tmChainInfoDS = sinon.stub().returns(testData.tnChainInfoDataInitChain);
    dataHandlerDS = sinon.stub().resolves(true);
    toCall = proxyquire('./initChain', {
      '../dataService/dataSource': {drop: deleteDS},
      '../dataService/tmChainInfoDS': {compose: tmChainInfoDS, create: tmChainInfoDS},
      '../dataService/dataHandler': {createValidator: dataHandlerDS}
    });
  });

  afterEach(() => {
    tmChainInfoDS.reset();
    deleteDS.reset();
    dataHandlerDS.reset();
  });

  it('Is drop function is called once - true ', async () => {
    expect(deleteDS).to.not.have.been.called;
    await toCall(testData.services, testData.tnChainInfoDataInitChain);
    expect(deleteDS).to.have.been.calledOnce;
  });

  it("calling initChain function is called with Promise- true", async() => {
    await toCall(testData.services, testData.tnChainInfoDataInitChain);
    expect(tmChainInfoDS).to.have.been.calledTwice;
  });
});
