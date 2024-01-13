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
 const tmBlockDS = require('./tmBlockDS');
 const testData = require('../../../../test/testData.js');

 describe('tmBlockDS', () => {
   beforeEach(() => {
   });

   it("Should have property", function() {
     tmBlockDS.should.have.property('create');
     tmBlockDS.should.have.property('update');
     tmBlockDS.should.have.property('compose');
     tmBlockDS.should.have.property('deleteAllData');
     tmBlockDS.should.have.property('deletebyID');
     tmBlockDS.should.have.property('findOne');
   });
   it('compose', function() {
     let response = tmBlockDS.compose(testData.tnBlockDataInitChain);
     expect(response).have.property('hash');
   });
   it.skip('create', function() {
     let response = tmBlockDS.create(testData.services.get('loopbackApp').models.tmBlock, testData.tnBlockDataInitChain, 'test');
     // console.log(response);
     expect(response).have.property('block');
     expect(response).have.property('hash');
     expect(response).have.property('transactions');
   });
   it('findOne', function() {
     let response = tmBlockDS.findOne(testData.services.get('loopbackApp').models.tmBlock, 'test');
     assert.isFulfilled(response);
     expect(response).to.eventually.deep.equal('found key');
   });
 });
