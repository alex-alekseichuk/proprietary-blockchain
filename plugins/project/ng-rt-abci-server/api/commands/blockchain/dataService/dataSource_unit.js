
 /**
  * Test abci transaction
  */
 'use strict';

 const sinonChai = require("sinon-chai");
 const chai = require('chai');
 chai.should();
 const chaiAsPromised = require('chai-as-promised');
 const sinon = require('sinon');
 const assert = chai.assert;
 const expect = chai.expect;
 chai.use(chaiAsPromised);
 chai.use(sinonChai);
 const testData = require('../../../../test/testData.js');
 const proxyquire = require('proxyquire').noCallThru();

 let services = testData.services;
 let configService = services.get('configService');
 var dropStub;
 var mongodb;
 var cb;
 let toCall;
 let config;
 let configNull;

 describe('dataSource', () => {
   beforeEach(() => {
     cb = function(err, client) {};
     mongodb = {
       connect: sinon.stub().withArgs('test', cb).returns(cb).resolves(true)
     };
     config = {get: sinon.stub().returns('test')};
     configNull = {get: sinon.stub().returns()};
     toCall = proxyquire('./dataSource', {
       mongodb: {MongoClient: mongodb}});
     dropStub = sinon.stub(toCall, 'drop');
     dropStub.returns(Promise.resolve(true));
   });

   afterEach(() => {
    // mongodb.MongoClient.reset();
     dropStub.reset();
   });

   it("config service Should have property", function() {
     configService.get("serverEnvironment").should.be.eql('serverEnvironment');
     configService.get("clusterId").should.be.eql('clusterId');
     configService.get("blockchainClusterId").should.be.eql('blockchainClusterId');
     configService.get("instanceId").should.be.eql('instanceId');
     configService.get("tenantId").should.be.eql('tenantId');
     configService.get("envId").should.be.eql('envId');
   });

   it("calling drop function - true", function() {
     let response = toCall.drop(configService);
     assert.isFulfilled(response);
     expect(response).to.eventually.deep.equal(true);
   });

   it('mongo drop is called , but no mongo host', done => {
     let response = toCall.dropMongoDatabase('test', configNull);
     assert.isFulfilled(response);
     done();
   });

   it('mongo drop is called', done => {
     let response = toCall.dropMongoDatabase('test', config);
     assert.isFulfilled(response);
     done();
   });

   it('mongo drop is called but error caught', done => {
     let response = toCall.dropMongoDatabase();
     assert.isFulfilled(response);
     done();
   });
 });
