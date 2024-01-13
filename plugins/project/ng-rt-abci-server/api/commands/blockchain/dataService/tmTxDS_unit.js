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
 const tmTxDS = require('./tmTxDS');
 const {Base64} = require('js-base64');

 const testData = require('../../../../test/testData.js');

 describe('tmTxDS', () => {
   beforeEach(() => {});

   it("Should have property", function() {
     tmTxDS.should.have.property('create');
     tmTxDS.should.have.property('update');
     tmTxDS.should.have.property('compose');
     tmTxDS.should.have.property('deleteAllData');
     tmTxDS.should.have.property('deletebyID');
     tmTxDS.should.have.property('findOne');
   });

   it('compose', async function() {
     let res = Base64.decode(testData.stubRequestabci.tx);
     let transaction = (new Buffer(res)).toString();
     let tx = JSON.parse(transaction);
     let response = await tmTxDS.compose(tx);
     expect(response).to.have.property('tmTx');
     expect(response).to.have.property('tmAsset');
     expect(response).to.have.property('tmMetadata');
   });

   it('create', function() {
     let response = tmTxDS.create(testData.services.get('loopbackApp').models.tmTx, testData.tmTxData);
     expect(response).have.property('txId');
     expect(response).have.property('txData');
   });

   it('findOne', function() {
     let response = tmTxDS.findOne(testData.services.get('loopbackApp').model.tmTx, 'test');
     expect(response).to.eventually.deep.equal('found key');
   });

   it('findAll', async function() {
     let response = await tmTxDS.findAll(testData.services.get('loopbackApp').models.tmTx);
     expect(response).to.deep.equal(testData.tmTxs);
   });
 });
