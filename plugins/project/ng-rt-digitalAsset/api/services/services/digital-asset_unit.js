'use strict';

const rewire = require('rewire');
const sinonChai = require("sinon-chai");
const chai = require('chai');
chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;
const assert = chai.assert;
const testData = require('../../../test/testData.js');

const txData = {
  serialNo: 'ABSDF232334553',
  name: 'BMW X3'
};
const amount = "1";
const isSigned = false;

const assetAbciDriver = "assetAbciDriver";
const assetBdbDriver = "assetBdbDriver";
const bdbDriverAssetDefinitionNotFungible = "bdbDriverAssetDefinitionNotFungible";
const assetFormat = {};
const txMethod = "Commit";
const txMetadata = {};
const digitalAssetService = rewire('./digital-asset');

describe('digital-asset', () => {
  describe('Function exports', () => {
    let daServices;
    daServices = digitalAssetService(testData.services);
    it("Test exported functions", function() {
      assert.property(daServices, 'resolveUser');
      assert.property(daServices, 'createAsset');
      assert.property(daServices, 'transferAsset');
      assert.property(daServices, 'getTx');
      assert.property(daServices, 'getAsset');
      assert.property(daServices, 'getBalance');
      assert.property(daServices, 'getTxHistory');
      assert.property(daServices, 'getAssetHistory');
      assert.property(daServices, 'createFileAsset');
      assert.property(daServices, 'getFileAsset');
    });
  });

  describe('Resolve User Function', () => {
    let daServices;
    beforeEach(() => {
      daServices = digitalAssetService(testData.services);
    });
    it("Resolves User from request", function() {
      const req = {user: testData.user};
      const resolvedUser = daServices.resolveUser(req);
      assert.deepEqual(resolvedUser, testData.user);
    });

    it("Resolves domainId: D01  as user", function() {
      const req = {};
      const user = {domainId: 'D01'};
      const resolvedUser = daServices.resolveUser(req);
      assert.deepEqual(resolvedUser, user);
    });
  });

  describe('Create Asset Function', () => {
    const daServices = digitalAssetService(testData.services);

    it("Creates an asset", async function() {
      const result = await daServices.createAsset(testData.ownerKeypair, txData, amount,
        txMetadata, isSigned, testData.user, assetBdbDriver, assetFormat, txMethod);
      assert.deepEqual(result, testData.resCommit);
    });

    it("Throws error", async function() {
      await expect(daServices.createAsset(testData.ownerKeypair, txData, amount, txMetadata, isSigned, testData.user,
        assetAbciDriver, assetFormat, txMethod)).to.be.rejectedWith('Blockchain driver abci is not supported');
    });

    it("Throws error if amount less than assetDefinition.minAmountValue", async function() {
      const amountValue = testData.assetDefinitions[1].minAmountValue / 2;
      await expect(daServices.createAsset(testData.ownerKeypair,
        txData, `${amountValue}`, txMetadata, isSigned, testData.user,
        assetBdbDriver, assetFormat, txMethod)).to.be.rejectedWith('Output amount less than possible amount fot this digital asset type');
    });

    it("Throws error if amount great than assetDefinition.maxAmountValue", async function() {
      const amountValue = testData.assetDefinitions[1].maxAmountValue + 0.1;
      await expect(daServices.createAsset(testData.ownerKeypair,
        txData, `${amountValue}`, txMetadata, isSigned, testData.user,
        assetBdbDriver, assetFormat, txMethod)).to.be.rejectedWith('Output amount great than possible amount fot this digital asset type');
    });
  });

  describe('Transfer Asset Function', () => {
    const daServices = digitalAssetService(testData.services);
    const senderKeypair = testData.ownerKeypair;
    const receiverPublicKey = testData.configKeyPair.public; // owner is the receiver here
    const unspentTxId = "62972940c68bb94b28b430f75278e7bb0d815a036bc56680ad45ea1b87104018";

    it("Create and posts a transfer asset request", async function() {
      const result = await daServices.transferAsset(senderKeypair, receiverPublicKey, unspentTxId, txMetadata,
        isSigned, testData.user, assetBdbDriver, assetFormat, txMethod);
      assert.deepEqual(result, testData.resCommit);
    });

    it("Throws error", async function() {
      await expect(daServices.transferAsset(senderKeypair, receiverPublicKey, unspentTxId,
        txMetadata, isSigned, testData.user, assetAbciDriver, assetFormat, txMethod)).to.be.rejected;
    });
  });

  describe('getTx Function', () => {
    const daServices = digitalAssetService(testData.services);

    it("Reads an existing transaction", async function() {
      const txId = "62972940c68bb94b28b430f75278e7bb0d815a036bc56680ad45ea1b87104018";
      const result = await daServices.getTx(txId, testData.user);
      assert.equal(result, testData.tmTx[0]);
    });

    it("Reads a not existing transaction, throws error", async() => {
      const txId = "62972940c68bb94b28b430f75278e7bb0d815a036bc56680ad45ea1b87104018+Something";
      const result = await daServices.getTx(txId, testData.user);
      expect(result).to.be.undefined;
    });
  });

  describe('getAsset Function', () => {
    const daServices = digitalAssetService(testData.services);

    it("fetches a transaction", async function() {
      const txId = "771cb659c4bbc44be647c53dfb94843b4b6594f085928c44ec1cef35e4edac2e";
      const result = await daServices.getAsset(txId, testData.user);
      assert.equal(result, testData.tmAsset[0]);
    });

    it("Throws error", async() => {
      const txId = "771cb659c4bbc44be647c53dfb94843b4b6594f085928c44ec1cef35e4edac2e+Something";
      const result = await daServices.getTx(txId, testData.user);
      expect(result).to.be.undefined;
    });
  });

  describe('getBalance Function', () => {
    const daServices = digitalAssetService(testData.services);
    let publicKey = "";
    let balance = {balance: '10'}; // testData getbalance service returns "10"

    it("Gets a balance", async function() {
      const result = await daServices.getBalance(publicKey, assetBdbDriver);
      expect(result).to.deep.equal(balance);
    });

    it("Throws error", async() => {
      await expect(daServices.getBalance(publicKey, assetAbciDriver)).to.be.rejected;
    });

    it("Throw for not fungible digital asset definition", async function() {
      await expect(daServices.getBalance(publicKey, bdbDriverAssetDefinitionNotFungible)).to.be.rejected;
    });

    it("Get balance for not fungible by asset id", async function() {
      const result = await daServices.getBalance(publicKey, bdbDriverAssetDefinitionNotFungible, '1');
      expect(result).to.deep.equal({balance: '11'});
    });
  });

  describe('getAssetsByOwner Function', () => {
    let daServices;
    it("Gets assets", async function() {
      let publicKey = "3PtBLYHY9n3KEr5KeSQ5RQiQXGUkesa6Vvqvk3KTEfN3";
      daServices = digitalAssetService(testData.services);
      const assets = await daServices.getAssetsByOwner(publicKey, assetBdbDriver);
      expect(assets).to.have.property('name');
      expect(assets).to.have.property('power');
      expect(assets).to.have.property('type');
    });
  });

  describe('createAssetDefinition Function', () => {
    const daServices = digitalAssetService(testData.services);

    const assetDefinitionToCreate = {
      digitalAsset: 'Car',
      validateSchema: true,
      divisibleAsset: false,
      fungibleAsset: false,
      blockchainProvider: 'T',
      blockchainProviderVersion: '0.30.0',
      blockchainDriver: 'bdbDriver',
      blockchainDriverVersion: '3.0.0',
      HTTPBlockchainIPAddress: '*default',
      HTTPBlockchainPort: 26657
    };

    it("Test create new asset definition", async function() {
      const assetDefinition = await daServices.createAssetDefinition(assetDefinitionToCreate);
      expect(assetDefinition).to.have.property('digitalAsset');
    });

    it("Test create asset definition with existing name", async function() {
      assetDefinitionToCreate.digitalAsset = 'assetBdbDriver';
      await expect(daServices.createAssetDefinition(assetDefinitionToCreate)).to.be.rejected;
    });
  });

  describe('getAssetDefinitions Function', () => {
    const daServices = digitalAssetService(testData.services);

    it("Test get all asset definitions", async function() {
      const assetDefinitions = await daServices.getAssetDefinitions();
      expect(assetDefinitions.length).to.be.equals(4);
    });
  });

  describe('getAssetDefinition Function', () => {
    let assetType = 'assetAbciDriver';
    const daServices = digitalAssetService(testData.services);

    it("Test get asset definition", async function() {
      const assetDefinition = await daServices.getAssetDefinition(assetType);
      expect(assetDefinition).to.have.property('digitalAsset').equal('assetAbciDriver');
      expect(assetDefinition).to.have.property('HTTPBlockchainIPAddress').equal('*default');
      expect(assetDefinition).to.have.property('HTTPBlockchainPort').equal(26657);
      expect(assetDefinition).to.have.property('createTransactionAllowedByUser').equal(true);
      expect(assetDefinition).to.have.property('createTransactionAllowedBySystem').equal(true);
      expect(assetDefinition).to.have.property('blockchainProvider').equal('T');
      expect(assetDefinition).to.have.property('blockchainProviderVersion').equal('0.30.0');
      expect(assetDefinition).to.have.property('blockchainDriver').equal('abci');
    });
  });
});

describe('get plugin settingd Function', () => {
  const daServices = digitalAssetService(testData.services);

  it("get public values", async function() {
    const pluginInfo = await daServices.getPublicPluginConfiguration(testData.pluginSettings);
    expect(pluginInfo).to.have.property('routeValidation').equal(true);
  });
});
