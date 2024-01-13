
"use strict";
const sinon = require('sinon');
const rewire = require('rewire');
const sinonChai = require("sinon-chai");
const chai = require('chai');
chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(sinonChai);
const assert = chai.assert;
const testData = require('../../../test/testData.js');
const resolveKeyPairService = rewire('./resolveKeyPair');

describe('Resolve Keys Function', () => {
  let kpServices;
  const {public: publicKey} = testData.configKeyPair;
  const fakeGetPublicKeyByExternalUserId = sinon.fake.returns(publicKey);
  const fakeGetPublicKeyByUserId = sinon.fake.returns(publicKey);

  beforeEach(() => {
    kpServices = resolveKeyPairService(testData.services);
    resolveKeyPairService.__set__("getPublicKeyByExternalUserId", fakeGetPublicKeyByExternalUserId);
    resolveKeyPairService.__get__("getPublicKeyByExternalUserId");
    resolveKeyPairService.__set__("getPublicKeyByUserId", fakeGetPublicKeyByUserId);
    resolveKeyPairService.__get__("getPublicKeyByUserId");
  });

  it("Resolves default(externalPublicKey) keyPair", function() {
    const keySource = "";
    const resolvedKeyPair = kpServices.resolveKeyPair(publicKey, keySource);
    assert.propertyVal(resolvedKeyPair, 'privateKey', undefined);
    assert.propertyVal(resolvedKeyPair, 'publicKey', publicKey);
  });

  it("Resolves externalPublicKey keyPair", function() {
    const keySource = "externalPublicKey";
    const resolvedKeyPair = kpServices.resolveKeyPair(publicKey, keySource);
    assert.propertyVal(resolvedKeyPair, 'privateKey', undefined);
    assert.propertyVal(resolvedKeyPair, 'publicKey', publicKey);
  });

  it("Resolves externalUserId keyPair", function() {
    const publicKeyOrId = "publicKeyOrId";
    const keySource = "externalUserId";
    const resolvedKeyPair = kpServices.resolveKeyPair(publicKeyOrId, keySource);
    assert.propertyVal(resolvedKeyPair, 'privateKey', undefined);
    assert.propertyVal(resolvedKeyPair, 'publicKey', publicKey);
  });

  it("Resolves userId keyPair", function() {
    const publicKeyOrId = "publicKeyOrId";
    const keySource = "userId";
    const resolvedKeyPair = kpServices.resolveKeyPair(publicKeyOrId, keySource);
    assert.propertyVal(resolvedKeyPair, 'privateKey', undefined);
    assert.propertyVal(resolvedKeyPair, 'publicKey', publicKey);
  });

  it("Resolves system keyPair", function() {
    const publicKeyOrId = "";
    const keySource = "system";
    const resolvedKeyPair = kpServices.resolveKeyPair(publicKeyOrId, keySource);
    assert.propertyVal(resolvedKeyPair, 'privateKey', 'GyVmzieYSK675twFaEVufpUTz1fkHKgDk6BeDfu2uBHS');
    assert.propertyVal(resolvedKeyPair, 'publicKey', '8HouGB1piizDEsREbRHYgPXZyxR5RYzSbWUYmuNSbSNd');
  });

  it("Resolves generate keyPair", function() {
    const publicKeyOrId = "";
    const keySource = "generate";
    const resolvedKeyPair = kpServices.resolveKeyPair(publicKeyOrId, keySource);
    assert.property(resolvedKeyPair, 'privateKey');
    assert.property(resolvedKeyPair, 'publicKey');
  });
});
