/**
 * Test abci transaction
 */
'use strict';
const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const service = require('./service');
const testData = require('../../test/testData.js');
const expect = chai.expect;
const mockery = require('mockery');

mockery.enable({
  warnOnReplace: false,
  warnOnUnregistered: false,
  useCleanCache: true
});

let serviceStub;
describe('abci backend', () => {
  beforeEach(() => {
    serviceStub =
    {
      add: sinon.stub(),
      remove: sinon.stub(),
      get: sinon.stub()
    };
  //  mockery.registerMock('./abci-server', serviceStub);
  });
  afterEach(() => {
    serviceStub.add.reset();
    serviceStub.remove.reset();
    serviceStub.get.reset();
  });

  it.skip("activate property", function() {
    service.activate(serviceStub, testData.pluginInstance);
    expect(serviceStub.add).to.have.been.calledTwice;
  });

  it("deactivate property", function() {
    service.deactivate(serviceStub);
    expect(serviceStub.remove).to.have.been.calledTwice;
  });

  it("activate test property", function() {
    service.deactivate(serviceStub);
    expect(serviceStub).to.have.property('remove');
  });
});
