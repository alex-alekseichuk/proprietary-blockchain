'use strict';

const chai = require('chai');
const sinon = require('sinon');
chai.should();

const proxyquire = require('proxyquire').noCallThru();
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
chai.use(chaiAsPromised);
const expect = chai.expect;

const testData = require('../../../../test/testData.js');

describe('test ', function() {
  let toCall;
  let tmLatestBlock;
  describe('test ', function() {
    beforeEach(() => {
      tmLatestBlock = sinon.stub().resolves(testData.tmLatestBlockInformation);
      toCall = proxyquire('./info', {
        '../dataService/tmLatestBlockInformationDS': {findLatestBlock: tmLatestBlock}
      });
    });

    afterEach(() => {
      tmLatestBlock.reset();
    });

    it('Is function info called ', async () => {
      let resp = await toCall(testData.services, testData.requestInfo);
      expect(resp.data).to.be.eql('PROJECT ABCI App');
      expect(resp).to.have.property('lastBlockHeight');
      expect(resp).to.have.property('version');
      expect(resp).to.have.property('lastBlockAppHash');
    });

    it('Is function info-tmBlock called once ', async () => {
      await toCall(testData.services, testData.requestInfo);
      expect(tmLatestBlock).to.have.been.calledOnce;
    });
  });

  describe('Returns LatestBlockInfo ', () => {
    let fakeCheckTmVersion = sinon.fake.returns(true);

    beforeEach(() => {
    });

    afterEach(() => {
      sinon.restore();
    });

    it('Logs Returns', async () => {
      fakeCheckTmVersion = sinon.fake.returns(false);
      toCall = proxyquire('./info', {
        './tmVersions': {checkTmVersion: fakeCheckTmVersion}
      });
      testData.requestInfo.version = "0.21.7-8cb2c2a0";
      await toCall(testData.services, testData.requestInfo);
    });
  });
});
