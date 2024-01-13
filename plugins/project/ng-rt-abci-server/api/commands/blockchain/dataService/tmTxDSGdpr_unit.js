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
 const tmTxGdpr = require('./tmTxDSGdpr');

 const testData = require('../../../../test/testData.js');

 describe('tmTxDSGdpr', () => {
   beforeEach(() => {});

   it("Should have property", function() {
     tmTxGdpr.should.have.property('create');
     tmTxGdpr.should.have.property('compose');
     tmTxGdpr.should.have.property('deleteAllData');
     tmTxGdpr.should.have.property('deletebyID');
     tmTxGdpr.should.have.property('findOne');
   });

   it('create', function() {
     let response = tmTxGdpr.create(testData.services.get('loopbackApp').models.tmTxGdpr, testData.tmTxGdpr);
     expect(response).have.property('GDPRCompliant');
     expect(response).have.property('transactionId');
   });

   it('findOne', function() {
     let response = tmTxGdpr.findOne(testData.services.get('loopbackApp').models.tmTxGdpr, 'test');
     expect(response).to.eventually.deep.equal('found key');
   });
 });
