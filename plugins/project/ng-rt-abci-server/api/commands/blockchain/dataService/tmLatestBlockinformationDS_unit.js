 /**
  * Test abci transaction
  */
 'use strict';

 const chai = require('chai');
 const sinonChai = require("sinon-chai");
 chai.should();
 const chaiAsPromised = require('chai-as-promised');
 chai.use(chaiAsPromised);
 chai.use(sinonChai);
 const expect = chai.expect;
 const tmLatestBlockInformationDS = require('./tmLatestBlockInformationDS');

 const testData = require('../../../../test/testData.js');

 describe('tmLatestBlockInformationDS', () => {
   beforeEach(() => {});

   it("Should have property", function() {
     tmLatestBlockInformationDS.should.have.property('create');
     tmLatestBlockInformationDS.should.have.property('compose');
     tmLatestBlockInformationDS.should.have.property('findOne');
     tmLatestBlockInformationDS.should.have.property('deletebyID');
     tmLatestBlockInformationDS.should.have.property('update');
     tmLatestBlockInformationDS.should.have.property('writeLatestBlockInfo');
     tmLatestBlockInformationDS.should.have.property('findLatestBlock');
   });

   it('compose', function() {
     let response = tmLatestBlockInformationDS.compose(testData.tmLatestBlockInformationInit);
     let block = response.block;
     expect(block).to.have.property('chainId').eql('test-chain');
     expect(block).to.have.property('height').eql(5);
     expect(block).to.have.property('appHash');
   });

   it('create', function() {
     let response = tmLatestBlockInformationDS.create(testData.services.get('loopbackApp').models.tmLatestBlockInformation, testData.tmLatestBlockInformation);
     // console.log(response);
     // expect(response).have.property('hash');
     expect(response.block).to.have.property('chainId').eql('test-chain');
     expect(response.block).to.have.property('height').eql(5);
     expect(response.block).to.have.property('appHash');
   });

   it('findOne', function() {
     let response = tmLatestBlockInformationDS.findOne(testData.services.get('loopbackApp').models.tmLatestBlockInformation, 'test');
     expect(response).to.eventually.deep.equal('found key');
   });

   it('writeLatestBlockInfo', done => {
     let response = tmLatestBlockInformationDS.writeLatestBlockInfo(testData.services.get('loopbackApp').models.tmLatestBlockInformation, testData.tmLatestBlockInformation);
     expect(response).to.be.empty;
     done();
   });
 });
