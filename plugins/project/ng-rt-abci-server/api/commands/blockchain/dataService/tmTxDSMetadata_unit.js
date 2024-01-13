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
 const tmMetadata = require('./tmTxDSMetadata');

 const testData = require('../../../../test/testData.js');

 describe('tmAsset', () => {
   beforeEach(() => {});

   it("Should have property", function() {
     tmMetadata.should.have.property('create');
     tmMetadata.should.have.property('update');
     tmMetadata.should.have.property('compose');
     tmMetadata.should.have.property('deleteAllData');
     tmMetadata.should.have.property('deletebyID');
     tmMetadata.should.have.property('findOne');
   });

   it('create', function() {
     let response = tmMetadata.create(testData.services.get('loopbackApp').models.tmMetadata, testData.tmMetadata);
     expect(response).have.property('txId');
     expect(response).have.property('metadata');
   });

   it('findOne', function() {
     let response = tmMetadata.findOne(testData.services.get('loopbackApp').models.tmMetadata, 'test');
     expect(response).to.eventually.deep.equal('found key');
   });
 });
