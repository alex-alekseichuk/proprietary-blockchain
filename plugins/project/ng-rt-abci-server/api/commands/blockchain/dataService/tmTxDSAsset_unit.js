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
 const tmAsset = require('./tmTxDSAsset');

 const testData = require('../../../../test/testData.js');

 describe('tmAsset', () => {
   beforeEach(() => {});

   it("Should have property", function() {
     tmAsset.should.have.property('create');
     tmAsset.should.have.property('update');
     tmAsset.should.have.property('compose');
     tmAsset.should.have.property('deleteAllData');
     tmAsset.should.have.property('deletebyID');
     tmAsset.should.have.property('findOne');
   });

   it('create', function() {
     let response = tmAsset.create(testData.services.get('loopbackApp').models.tmAsset, testData.tmAssetData);
     expect(response).have.property('txId');
     expect(response).have.property('data');
     expect(response).have.property('format');
     expect(response).have.property('type');
   });

   it('findOne', function() {
     let response = tmAsset.findOne(testData.services.get('loopbackApp').model.tmAsset, 'test');
     expect(response).to.eventually.deep.equal('found key');
   });

   it('findAll', async function() {
     let response = await tmAsset.findAll(testData.services.get('loopbackApp').model.tmAsset);
     expect(response).to.deep.equal(testData.tmAssets);
   });
 });
