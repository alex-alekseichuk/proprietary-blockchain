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
 const assert = chai.assert;
 const tmChainInfoDS = require('./tmChainInfoDS');
 const testData = require('../../../../test/testData.js');

 describe('tmChainInfoDS', () => {
   beforeEach(() => {});

   it("Should have property", function() {
     tmChainInfoDS.should.have.property('create');
     tmChainInfoDS.should.have.property('update');
     tmChainInfoDS.should.have.property('compose');
     tmChainInfoDS.should.have.property('deleteAllData');
     tmChainInfoDS.should.have.property('deletebyID');
     tmChainInfoDS.should.have.property('findOne');
   });

   it('compose', function() {
     let response = tmChainInfoDS.compose(testData.tnChainInfoDataInitChain);
     expect(response.chainId).to.be.equal('test');
   });
   it('create', function() {
     let response = tmChainInfoDS.create(testData.services.get('loopbackApp').models.tmChainInfo, testData.tnChainInfoData);
    // console.log('response',response)
     expect(response).have.property('chainId');
     expect(response).have.property('lowUTC');
   });
   it('findOne', function() {
     let response = tmChainInfoDS.findOne(testData.services.get('loopbackApp').models.tmChainInfo, 'test');
     assert.isFulfilled(response);
     expect(response).to.eventually.deep.equal('found key');
   });
 });
