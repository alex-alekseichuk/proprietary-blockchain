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
const invalidTestData = require('../../../test/invalidData.js');
const validTestData = require("../../../test/testDataExplorer.js");

const blockExplorerService = rewire('./block-explorer');

describe('block-explorer', () => {
  describe('Function exports', () => {
    let explorerServices;
    explorerServices = blockExplorerService(validTestData.services);
    it("Test exported functions", function() {
      assert.property(explorerServices, 'getBlockbyHash');
      assert.property(explorerServices, 'getBlockbyHeight');
      assert.property(explorerServices, 'getBlockFromHeight');
      assert.property(explorerServices, 'getBlockToHeight');
      assert.property(explorerServices, 'getBlocks');
      assert.property(explorerServices, 'getBlockFromTime');
      assert.property(explorerServices, 'getBlockToTime');
      assert.property(explorerServices, 'getTransactions');
      assert.property(explorerServices, 'getTxFromTime');
      assert.property(explorerServices, 'getTxToTime');
      assert.property(explorerServices, 'getTxbyHash');
      assert.property(explorerServices, 'getAssets');
      assert.property(explorerServices, 'getAssetbytxId');
      assert.property(explorerServices, 'getAssetFromTime');
      assert.property(explorerServices, 'getAssetToTime');
    });
  });

  describe('get block by hash Function', () => {
    it("get block", async function() {
      const explorerServices = blockExplorerService(validTestData.services);
      const result = await explorerServices.getBlockbyHash('50d1acb0428a58b446cc77b2a2d10934419e50e2d64dc2f68ffb491010fc8c57');
      assert.deepEqual(result, validTestData.block[1]);
    });

    it("Throws error", async function() {
      const explorerServices = blockExplorerService(invalidTestData.services);
      const result = await explorerServices.getBlockbyHash('50d1acb0428a58b446cc77b2a2d10934419e50e2d-something');
      await expect(result).to.be.equal(null);
    });
  });

  describe('get block by height Function', () => {
    it("get block", async function() {
      const explorerServices = blockExplorerService(validTestData.services);
      const result = await explorerServices.getBlockbyHeight('31');
      assert.deepEqual(result, validTestData.block[0]);
    });

    it("Throws error", async function() {
      const explorerServices = blockExplorerService(invalidTestData.services);
      const result = await explorerServices.getBlockbyHeight('1');
      await expect(result).to.be.equal(null);
    });
  });

  describe('get all block Function', () => {
    it("get blocks", async function() {
      const explorerServices = blockExplorerService(validTestData.services);
      const result = await explorerServices.getBlocks();
      assert.deepEqual(result, validTestData.block);
    });

    it("Throws error", async function() {
      const explorerServices = blockExplorerService(invalidTestData.services);
      const result = await explorerServices.getBlocks();
      await expect(result).to.be.equal(null);
    });
  });

  describe('get all block from/to height Function', () => {
    it("get blocks from height 31 in ascending order", async function() {
      const explorerServices = blockExplorerService(validTestData.services);
      const result = await explorerServices.getBlockFromHeight('31');
      assert.deepEqual(result, validTestData.block);
    });

    it("Throws error", async function() {
      const explorerServices = blockExplorerService(invalidTestData.services);
      const result = await explorerServices.getBlockFromHeight('40');
      await expect(result).to.be.equal(null);
    });

    it("get blocks to height 35 ascending order", async function() {
      const explorerServices = blockExplorerService(validTestData.services);
      const result = await explorerServices.getBlockToHeight('35');
      assert.deepEqual(result, validTestData.block);
    });

    it("Throws error", async function() {
      const explorerServices = blockExplorerService(invalidTestData.services);
      const result = await explorerServices.getBlockToHeight('40');
      await expect(result).to.be.equal(null);
    });
  });

  describe('get all block from/to time Function', () => {
    it("get blocks from time 1567413640 in ascending order", async function() {
      const explorerServices = blockExplorerService(validTestData.services);
      const result = await explorerServices.getBlockFromTime('1567413640');
      assert.deepEqual(result, validTestData.block);
    });

    it("Throws error", async function() {
      const explorerServices = blockExplorerService(invalidTestData.services);
      const result = await explorerServices.getBlockFromTime('15674136405355');
      await expect(result).to.be.equal(null);
    });

    it("get blocks to time 1567413641 in ascending order", async function() {
      const explorerServices = blockExplorerService(validTestData.services);
      const result = await explorerServices.getBlockToTime('1567413641');
      assert.deepEqual(result, validTestData.block);
    });

    it("Throws error", async function() {
      const explorerServices = blockExplorerService(invalidTestData.services);
      const result = await explorerServices.getBlockToTime('15674136405355');
      await expect(result).to.be.equal(null);
    });
  });

  describe('get all transactions Function', () => {
    it("get transactions", async function() {
      const explorerServices = blockExplorerService(validTestData.services);
      const result = await explorerServices.getTransactions();
      assert.deepEqual(result, validTestData.txs);
    });

    it("Throws error", async function() {
      const explorerServices = blockExplorerService(invalidTestData.services);
      const result = await explorerServices.getTransactions();
      await expect(result).to.be.equal(null);
    });
  });

  describe('get all transaction from/to time Function', () => {
    it("get transaction from time 1567413640 in ascending order", async function() {
      const explorerServices = blockExplorerService(validTestData.services);
      const result = await explorerServices.getTxFromTime('1587114235');
      assert.deepEqual(result, validTestData.txs);
    });

    it("Throws error", async function() {
      const explorerServices = blockExplorerService(invalidTestData.services);
      const result = await explorerServices.getTxFromTime('15674136405355');
      await expect(result).to.be.equal(null);
    });

    it("get transaction to time 1567413641 in ascending order", async function() {
      const explorerServices = blockExplorerService(validTestData.services);
      const result = await explorerServices.getTxToTime('1587117490');
      assert.deepEqual(result, validTestData.txs);
    });

    it("Throws error", async function() {
      const explorerServices = blockExplorerService(invalidTestData.services);
      const result = await explorerServices.getTxToTime('15674136405355');
      await expect(result).to.be.equal(null);
    });
  });

  describe('get all assets Function', () => {
    it("get assets", async function() {
      const explorerServices = blockExplorerService(validTestData.services);
      const result = await explorerServices.getAssets();
      assert.deepEqual(result, validTestData.assets);
    });

    it("Throws error", async function() {
      const explorerServices = blockExplorerService(invalidTestData.services);
      const result = await explorerServices.getAssets();
      await expect(result).to.be.equal(null);
    });
  });

  describe('get all asset from/to time Function', () => {
    it("get asset from time 1567413640 in ascending order", async function() {
      const explorerServices = blockExplorerService(validTestData.services);
      const result = await explorerServices.getAssetFromTime('1587114235');
      assert.deepEqual(result, validTestData.assets);
    });

    it("Throws error", async function() {
      const explorerServices = blockExplorerService(invalidTestData.services);
      const result = await explorerServices.getAssetFromTime('15674136405355');
      await expect(result).to.be.equal(null);
    });

    it("get asset to time 1567413641 in ascending order", async function() {
      const explorerServices = blockExplorerService(validTestData.services);
      const result = await explorerServices.getAssetToTime('1587117490');
      assert.deepEqual(result, validTestData.assets);
    });

    it("Throws error", async function() {
      const explorerServices = blockExplorerService(invalidTestData.services);
      const result = await explorerServices.getAssetToTime('15674136405355');
      await expect(result).to.be.equal(null);
    });
  });
});

