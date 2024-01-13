'use strict';

const sinonChai = require("sinon-chai");
const rewire = require("rewire");
const service = rewire('./explorer-service.js');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const testDataExplorer = require('../../../test/testDataExplorer');
const nock = require('nock');

chai.should();

chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;
const assert = chai.assert;

describe('Test explorer-service', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer._services);
  });

  it("Test exported functions", function () {
    blockExplorer.should.have.property("getBlockbyHash");
    blockExplorer.should.have.property("getBlockbyHeight");
    blockExplorer.should.have.property("getBlockFromHeight");
    blockExplorer.should.have.property("getBlockToHeight");
    blockExplorer.should.have.property("getBlocks");
    blockExplorer.should.have.property("getBlockFromTime");
    blockExplorer.should.have.property("getBlockToTime");
    blockExplorer.should.have.property("getTransactions");
    blockExplorer.should.have.property("getTxbyHash");
    blockExplorer.should.have.property("getTxFromTime");
    blockExplorer.should.have.property("getTxToTime");
    blockExplorer.should.have.property("getAssets");
    blockExplorer.should.have.property("getAssetbytxId");
    blockExplorer.should.have.property("getAssetFromTime");
    blockExplorer.should.have.property("getAssetToTime");
    blockExplorer.should.have.property("txStructure");
    blockExplorer.should.have.property("assetStructure");
    blockExplorer.should.have.property("blockStructure");
    blockExplorer.should.have.property("timeValidation");
    blockExplorer.should.have.property("resolvedOutputs");
    blockExplorer.should.have.property("resolvedInputs");
  });
});

describe('Time validation', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer._services);
  });
  let timeString = 'Mon, 27 Apr 2020 14:31:04 GMT';
  let timeNumber = '1587997864';

  it("Time validation if string", async function () {
    let isValid = await blockExplorer.timeValidation(timeString);
    assert.isNumber(isValid);
    isValid.should.be.equal(1587997864);
  });

  it("Time validation if number", async function () {
    let isValid = await blockExplorer.timeValidation(timeNumber);
    assert.isNumber(isValid);
    isValid.should.be.equal(1587997864);
  });
});


describe('resolved inputs and outputs', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer._services);
  });
  let outputs = [
    {
      "condition": {
        "details": {
          "type": "ed25519-sha-256",
          "public_key": "GYJSQ26pB24mwafXbMLpsjgD3QLS8oaKbjmnSPbiWBWB"
        },
        "uri": "ni:///sha-256;la04J_P9gxWeaxaWNw6EkIyEFRxjkZENbqFTBeRv11g?fpt=ed25519-sha-256&cost=131072"
      },
      "amount": "50",
      "public_keys": [
        "GYJSQ26pB24mwafXbMLpsjgD3QLS8oaKbjmnSPbiWBWB"
      ]
    },
    {
      "condition": {
        "details": {
          "type": "ed25519-sha-256",
          "public_key": "3PtBLYHY9n3KEr5KeSQ5RQiQXGUkesa6Vvqvk3KTEfN3"
        },
        "uri": "ni:///sha-256;caXnLa0M6tsPBjCLAK5Zm9RahUlyVBVoGs8PfQnw0Z4?fpt=ed25519-sha-256&cost=131072"
      },
      "amount": "25.5",
      "public_keys": [
        "3PtBLYHY9n3KEr5KeSQ5RQiQXGUkesa6Vvqvk3KTEfN3"
      ]
    },
    {
      "condition": {
        "details": {
          "type": "ed25519-sha-256",
          "public_key": "7pBa5so2Tcee2kZVDeSV194xWR2wH5GGbMbbAMaGd4pj"
        },
        "uri": "ni:///sha-256;ytKfGW-FqGW94Wu4Kt8D3aQQb4YXXMa7RWPYsQLxjVM?fpt=ed25519-sha-256&cost=131072"
      },
      "amount": "24.5",
      "public_keys": [
        "7pBa5so2Tcee2kZVDeSV194xWR2wH5GGbMbbAMaGd4pj"
      ]
    }
  ]
  let inputs = [{
    "fulfillment": "pGSAIObkBqsIPXxetjj8ng0lbDiHhvSh8mehvw2HOyOm0-RcgUClVCFFfftUxQCSFcIuS3xa1MnnX4AuLMOMJ3figUkmBR8hnLSO7ckcy2-e02depgiPJg1ZlL-4GEGu8YFbTecI",
    "fulfills": {
      "output_index": 0,
      "transaction_id": "6373ea6648bd852f764586197858b817cd670304e6b0cf06620f79d5e812e79d"
    },
    "owners_before": [
      "GYJSQ26pB24mwafXbMLpsjgD3QLS8oaKbjmnSPbiWBWB"
    ]
  }]
  const txId = ["6373ea6648bd852f764586197858b817cd670304e6b0cf06620f79d5e812e79d"]
  const operation = 'CREATE'
  const expectedInputs = { inputs:[ { owner: 'GYJSQ26pB24mwafXbMLpsjgD3QLS8oaKbjmnSPbiWBWB', amount: 100 } ], amount: 100 };
  const expectedoutputs = [{
    owner: 'GYJSQ26pB24mwafXbMLpsjgD3QLS8oaKbjmnSPbiWBWB',
    amount: '50'
  },
  {
    owner: '3PtBLYHY9n3KEr5KeSQ5RQiQXGUkesa6Vvqvk3KTEfN3',
    amount: '25.5'
  },
  {
    owner: '7pBa5so2Tcee2kZVDeSV194xWR2wH5GGbMbbAMaGd4pj',
    amount: '24.5'
  }];
  it("resolved inputs", async function () {
    let isValid = await blockExplorer.resolvedInputs(inputs, txId, operation);
    assert.deepEqual(isValid, expectedInputs);
  });

  it("resolved outputs", async function () {
    let isValid = await blockExplorer.resolvedOutputs(outputs);
    assert.deepEqual(isValid, expectedoutputs);
  });
});

describe('block structure', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer._services);
  });
  let validBlock = testDataExplorer.blocks[0];

  it("valid block", async function () {
    let isValid = await blockExplorer.blockStructure(validBlock);
    isValid.should.have.property('blockHash').equal('a4cb61b4c30c6ffdcfb0a79d5bc59ce33b03031f3a4ab94614a1ae9285e7df2a');
    isValid.should.have.property('blockHeight').equal(1);
    isValid.should.have.property('blockTime').equal(1587997864);
    isValid.should.have.property('transactionNo').equal(0);
    isValid.should.have.property('transactionHashes');
    isValid.should.have.property('appHash').equal("");
    isValid.should.have.property('blockProposerNodeId').equal('ce5f2bd8a285d1735c48d261e6e4be7625ce0d2e');
  });
});

describe('tx structure', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer._services);
  });
  let validCreate = testDataExplorer.tmTxData[0];
  let validTransfer = testDataExplorer.tmTxData[1];

  it("if operation is create", async function () {
    let isValid = await blockExplorer.txStructure(validCreate);
    isValid.should.have.property('transferSourceTxId').to.eql(['14c02c851b790850065d79439e8b8f1e2f6c0142242d5fd474c2dd977b9b7c94']);
    isValid.should.have.property('txId').equal('14c02c851b790850065d79439e8b8f1e2f6c0142242d5fd474c2dd977b9b7c94');
    isValid.should.have.property('txType').equal('CREATE');
    isValid.should.have.property('txTime').equal(1557925150);
  });

  it("if operation is transfer", async function () {
    let isValid = await blockExplorer.txStructure(validTransfer);
    isValid.should.have.property('transferSourceTxId').to.eql(['14c02c851b790850065d79439e8b8f1e2f6c0142242d5fd474c2dd977b9b7c94']);
    isValid.should.have.property('txId').equal('63e181a8b950f5d5e603c302f6ba9b38756317556b617334bdb1d25db7c06fe7');
    isValid.should.have.property('txType').equal('TRANSFER');
    isValid.should.have.property('txTime').equal(1557925151);
  });
});

describe('asset structure', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer._services);
  });
  let validCreate = testDataExplorer.tmAsset[0];
  let validTransfer = testDataExplorer.tmAsset[1];

  it("if operation is create", async function () {
    let isValid = await blockExplorer.assetStructure(validCreate);
    isValid.should.have.property('assetId').equal('14c02c851b790850065d79439e8b8f1e2f6c0142242d5fd474c2dd977b9b7c94');
    isValid.should.have.property('assetType').equal('tendermint_blob');
    isValid.should.have.property('assetHash').equal('e8ae5c6bf5d5d954f9ac888423a48dd85cb96bef9b9cae8e399b84233d27edfb');
    isValid.should.have.property('data');
    isValid.should.have.property('divisiblity').equal('No');
  });

  it("if operation is transfer", async function () {
    let isValid = await blockExplorer.assetStructure(validTransfer);
    isValid.should.have.property('assetId').equal('63e181a8b950f5d5e603c302f6ba9b38756317556b617334bdb1d25db7c06fe7');
    isValid.should.have.property('assetType').equal('tendermint_blob');
    isValid.should.have.property('data');
    isValid.should.have.property('divisiblity').equal('No');
  });
});

describe('Retrieve block by hash of a block', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer._services);
  });
  let expectedresult = testDataExplorer.blockResult;

  it("get block by hash", async function () {
    let blockHash = testDataExplorer.blocks[0].hash;
    let block = await blockExplorer.getBlockbyHash(blockHash);
    assert.deepEqual(block, expectedresult);
  });

  it("invalid hash", async function () {
    await expect(blockExplorer.getBlockbyHash('blockHash')).to.be.rejected;
  });
});

describe('Retrieve all blocks with limit and sorting is aescending', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer.services);
  });

  it("get blocks with limit", async function () {
    let sortBy = 'ASC';
    let limit = 4;
    let offset = 0;
    let blocks = await blockExplorer.getBlocks(limit, sortBy, offset);
    expect(blocks).to.have.length(4);
    expect(blocks[0]).to.have.property('blockHeight').equal(1);
  });
});

describe('Retrieve all blocks with limit and sorting is descending', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer._services);
  });

  it("get blocks with limit", async function () {
    let sortBy = 'ASC';
    let limit = 4;
    let offset = 0;
    let blocks = await blockExplorer.getBlocks(limit, sortBy, offset);
    expect(blocks).to.have.length(4);
    expect(blocks[0]).to.have.property('blockHeight').equal(4);
  });
});

describe('Retrieve block by height of a block', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer.services);
  });
  let expectedresult = testDataExplorer.blockResult;
  it("get block by height", async function () {
    let blockHeight = testDataExplorer.blocks[0].block.height.low;
    let block = await blockExplorer.getBlockbyHeight(blockHeight);
    assert.deepEqual(block, expectedresult);
  });

  it("invalid height", async function () {
    await expect(blockExplorer.getBlockbyHeight('blockHeight')).to.be.rejected;
  });
});

describe('Retrieve blocks from/to height of a block if sorting is ascending', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer.services);
  });
  it("get block 'from' height in ASC order", async function () {
    let blockHeight = testDataExplorer.blocks[0].block.height.low;
    let sortBy = 'ASC';
    let limit = 4;
    let offset = 0;
    let block = await blockExplorer.getBlockFromHeight(blockHeight, sortBy, limit, offset);
    expect(block).to.have.length(4);
    expect(block[0]).to.have.property('blockHeight').equal(1);
  });

  it("get block 'from' height in ASC order with limit = 2", async function () {
    let blockHeight = testDataExplorer.blocks[0].block.height.low;
    let sortBy = 'ASC';
    let limit = 2;
    let offset = 0;
    let block = await blockExplorer.getBlockFromHeight(blockHeight, sortBy, limit, offset);
    expect(block).to.have.length(2);
    expect(block[0]).to.have.property('blockHeight').equal(1);
  });

  it("get block 'to' height in ASC order", async function () {
    let blockHeight = testDataExplorer.blocks[3].block.height.low;
    let sortBy = 'ASC';
    let limit = 4;
    let offset = 0;
    let block = await blockExplorer.getBlockToHeight(blockHeight, sortBy, limit, offset);
    expect(block).to.have.length(4);
    expect(block[0]).to.have.property('blockHeight').equal(1);
  });

});

describe('Retrieve blocks from/to height of a block if sorting is descending', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer._services);
  });
  it("get block 'from' height in DESC order", async function () {
    let blockHeight = testDataExplorer.blocks[0].block.height.low;
    let sortBy = 'DESC';
    let limit = 4;
    let offset = 0;
    let block = await blockExplorer.getBlockFromHeight(blockHeight, sortBy, limit, offset);
    expect(block).to.have.length(4);
    expect(block[0]).to.have.property('blockHeight').equal(4);
  });

  it("get block 'from' height in DESC order with limit = 2", async function () {
    let blockHeight = testDataExplorer.blocks[0].block.height.low;
    let sortBy = 'DESC';
    let limit = 2;
    let offset = 0;
    let block = await blockExplorer.getBlockFromHeight(blockHeight, sortBy, limit, offset);
    expect(block).to.have.length(2);
    expect(block[0]).to.have.property('blockHeight').equal(4);
  });

  it("get block 'to' height in DESC order", async function () {
    let blockHeight = testDataExplorer.blocks[3].block.height.low;
    let sortBy = 'DESC';
    let limit = 4;
    let offset = 0;
    let block = await blockExplorer.getBlockToHeight(blockHeight, sortBy, limit, offset);
    expect(block).to.have.length(4);
    expect(block[0]).to.have.property('blockHeight').equal(4);
  });

});

describe('Retrieve blocks from/to time of a block if sorting is ascending', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer.services);
  });
  it("get block 'from' time in ASC order", async function () {
    let blockTime = testDataExplorer.blocks[0].blockTime;
    let sortBy = 'ASC';
    let limit = 4;
    let offset = 0;
    let block = await blockExplorer.getBlockFromTime(blockTime, sortBy, limit, offset);
    expect(block).to.have.length(4);
    expect(block[0]).to.have.property('blockTime').equal(1587997864);
  });

  it("get block 'from' time in ASC order with limit = 2", async function () {
    let blockTime = testDataExplorer.blocks[0].blockTime;
    let sortBy = 'ASC';
    let limit = 2;
    let offset = 0;
    let block = await blockExplorer.getBlockFromTime(blockTime, sortBy, limit, offset);
    expect(block).to.have.length(2);
    expect(block[0]).to.have.property('blockTime').equal(1587997864);
  });

  it("get block 'to' time in ASC order", async function () {
    let blockTime = testDataExplorer.blocks[3].blockTime;
    let sortBy = 'ASC';
    let limit = 4;
    let offset = 0;
    let block = await blockExplorer.getBlockToTime(blockTime, sortBy, limit, offset);
    expect(block).to.have.length(4);
    expect(block[0]).to.have.property('blockTime').equal(1587997864);
  });

  it("invalid time", async function () {
    await expect(blockExplorer.getBlockFromTime('blockTime')).to.be.rejected;
  });
});

describe('Retrieve blocks from/to time of a block if sorting is descending', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer._services);
  });
  it("get block 'from' time in DESC order", async function () {
    let blockTime = testDataExplorer.blocks[3].blockTime;
    let sortBy = 'DESC';
    let limit = 4;
    let offset = 0;
    let block = await blockExplorer.getBlockFromTime(blockTime, sortBy, limit, offset);
    expect(block).to.have.length(4);
    expect(block[0]).to.have.property('blockTime').equal(1587998641);
  });

  it("get block 'from' time in DESC order with limit = 2", async function () {
    let blockTime = testDataExplorer.blocks[0].blockTime;
    let sortBy = 'DESC';
    let limit = 2;
    let offset = 0;
    let block = await blockExplorer.getBlockFromTime(blockTime, sortBy, limit, offset);
    expect(block).to.have.length(2);
    expect(block[0]).to.have.property('blockTime').equal(1587998641);
  });

  it("get block 'to' time in DESC order", async function () {
    let blockTime = testDataExplorer.blocks[0].blockTime;
    let sortBy = 'DESC';
    let limit = 4;
    let offset = 0;
    let block = await blockExplorer.getBlockToTime(blockTime, sortBy, limit, offset);
    expect(block).to.have.length(4);
    expect(block[0]).to.have.property('blockTime').equal(1587998641);
  });

  it("invalid time", async function () {
    await expect(blockExplorer.getBlockFromTime('blockTime')).to.be.rejected;
  });
});

describe('Retrieve transaction by hash', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer.services);
  });
  let expectedresult = testDataExplorer.txResult;

  it("get block by hash", async function () {
    let txHash = testDataExplorer.tmTxData[0].txId;
    let transaction = await blockExplorer.getTxbyHash(txHash);
    assert.deepEqual(transaction, expectedresult);
  });

  it("invalid hash", async function () {
    await expect(blockExplorer.getTxbyHash('txHash')).to.be.rejected;
  });
});

describe('Retrieve all transactions with limit and sorting is aescending', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer.services);
  });

  it("get txs with limit", async function () {    
    let sortBy = 'ASC';
    let limit = 4;
    let offset = 0;
    let txs = await blockExplorer.getTransactions(limit, sortBy, offset);
    expect(txs).to.have.length(4);
  });
});

describe('Retrieve all transactions with limit and sorting is descending', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer._services);
  });

  it("get txs with limit", async function () {
    let sortBy = 'DESC';
    let limit = 4;
    let offset = 0;
    let txs = await blockExplorer.getTransactions(limit, sortBy, offset);
    expect(txs).to.have.length(4);
  });
});

describe('Retrieve txs from/to time of a tx if sorting is ascending', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer.services);
  });
  it("get txs 'from' time in ASC order", async function () {
    let txTime = testDataExplorer.tmTxData[0].txTime;
    let sortBy = 'ASC';
    let limit = 2;
    let offset = 0;
    let txs = await blockExplorer.getTxFromTime(txTime, sortBy, limit, offset);
    expect(txs).to.have.length(2);
    expect(txs[0]).to.have.property('txTime').equal(1557925150);
    expect(txs[1]).to.have.property('txTime').equal(1557925151);
  });

  it("get txs 'to' time in ASC order", async function () {
    let txTime = testDataExplorer.tmTxData[1].txTime;
    let sortBy = 'ASC';
    let limit = 2;
    let offset = 0;
    let txs = await blockExplorer.getTxToTime(txTime, sortBy, limit, offset);
    expect(txs).to.have.length(2);
    expect(txs[0]).to.have.property('txTime').equal(1557925150);
    expect(txs[1]).to.have.property('txTime').equal(1557925151);
  });

  it("invalid time", async function () {
    await expect(blockExplorer.getTxFromTime('txTime')).to.be.rejected;
  });
});

describe('Retrieve txs from/to time of a tx if sorting is descending', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer._services);
  });
  it("get txs 'from' time in DESC order", async function () {
    let txTime = testDataExplorer.tmTxData[1].txTime;
    let sortBy = 'DESC';
    let limit = 2;
    let offset = 0;
    let txs = await blockExplorer.getTxFromTime(txTime, sortBy, limit, offset);
    expect(txs).to.have.length(2);
    expect(txs[0]).to.have.property('txTime').equal(1557925153);
    expect(txs[1]).to.have.property('txTime').equal(1557925152);
  });

  it("get txs 'to' time in DESC order", async function () {
    let txTime = testDataExplorer.tmTxData[0].txTime;
    let sortBy = 'DESC';
    let limit = 2;
    let offset = 0;
    let txs = await blockExplorer.getTxToTime(txTime, sortBy, limit, offset);
    expect(txs).to.have.length(2);
    expect(txs[0]).to.have.property('txTime').equal(1557925153);
    expect(txs[1]).to.have.property('txTime').equal(1557925152);
  });

  it("invalid time", async function () {
    await expect(blockExplorer.getTxFromTime('txTime')).to.be.rejected;
  });
});

describe('Retrieve asset by txId', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer.services);
  });
  let expectedresult = testDataExplorer.assetResult;

  it("get asset by txId", async function () {
    let txId = testDataExplorer.tmTxData[0].txId;
    let asset = await blockExplorer.getAssetbytxId(txId);
    assert.deepEqual(asset, expectedresult);
  });

  it("invalid txId", async function () {
    await expect(blockExplorer.getAssetbytxId('txId')).to.be.rejected;
  });
});

describe('Retrieve all assets with limit and sorting is aescending', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer.services);
  });

  it("get assets with limit", async function () {
    let sortBy = 'ASC';
    let limit = 2;
    let offset = 0;
    let assets = await blockExplorer.getAssets(limit, sortBy, offset);
    expect(assets).to.have.length(4);
  });
});

describe('Retrieve all assets with limit and sorting is descending', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer._services);
  });

  it("get assets with limit", async function () {
    let sortBy = 'DESC';
    let limit = 2;
    let offset = 0;
    let assets = await blockExplorer.getAssets(limit, sortBy, offset);
    expect(assets).to.have.length(4);
  });
});

describe('Retrieve assets from/to time of a assets if sorting is ascending', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer.services);
  });
  it("get assets 'from' time in ASC order", async function () {
    let assetTime = testDataExplorer.tmTxData[0].txTime;
    let sortBy = 'ASC';
    let limit = 4;
    let offset = 0;
    let assets = await blockExplorer.getAssetFromTime(assetTime, sortBy, limit, offset);
    expect(assets).to.have.length(4);
    expect(assets[0]).to.have.property('assetTime').equal(1557925150);
    expect(assets[1]).to.have.property('assetTime').equal(1557925151);
    expect(assets[2]).to.have.property('assetTime').equal(1557925152);
    expect(assets[3]).to.have.property('assetTime').equal(1557925153);
  });

  it("get assets 'from' time in ASC order when limit is 2", async function () {
    let assetTime = testDataExplorer.tmTxData[0].txTime;
    let sortBy = 'ASC';
    let limit = 2;
    let offset = 0;
    let assets = await blockExplorer.getAssetFromTime(assetTime, sortBy, limit, offset);
    expect(assets).to.have.length(2);
    expect(assets[0]).to.have.property('assetTime').equal(1557925150);
    expect(assets[1]).to.have.property('assetTime').equal(1557925151);
  });

  it("get assets 'to' time in ASC order", async function () {
    let assetTime = testDataExplorer.tmTxData[3].txTime;
    let sortBy = 'ASC';
    let limit = 4;
    let offset = 0;
    let assets = await blockExplorer.getAssetToTime(assetTime, sortBy, limit, offset);
    expect(assets).to.have.length(4);
    expect(assets[0]).to.have.property('assetTime').equal(1557925150);
    expect(assets[1]).to.have.property('assetTime').equal(1557925151);
    expect(assets[2]).to.have.property('assetTime').equal(1557925152);
    expect(assets[3]).to.have.property('assetTime').equal(1557925153);
  });

  it("invalid time", async function () {
    await expect(blockExplorer.getAssetFromTime('assetTime')).to.be.rejected;
  });
});

describe('Retrieve assets from/to time of a asset if sorting is descending', () => {
  let blockExplorer;
  beforeEach(() => {
    blockExplorer = service(testDataExplorer.testServices);
  });
  it("get assets 'from' time in DESC order", async function () {
    let assetTime = testDataExplorer.tmTxData[3].txTime;
    let sortBy = 'DESC';
    let limit = 4;
    let offset = 0;
    let assets = await blockExplorer.getAssetFromTime(assetTime, sortBy, limit, offset);
    expect(assets).to.have.length(4);
    expect(assets[0]).to.have.property('assetTime').equal(1557925153);
    expect(assets[1]).to.have.property('assetTime').equal(1557925152);
    expect(assets[2]).to.have.property('assetTime').equal(1557925151);
    expect(assets[3]).to.have.property('assetTime').equal(1557925150);
  });

  it("get assets 'from' time in DESC order when limit is 2", async function () {
    let assetTime = testDataExplorer.tmTxData[3].txTime;
    let sortBy = 'DESC';
    let limit = 2;
    let offset = 0;
    let assets = await blockExplorer.getAssetFromTime(assetTime, sortBy, limit, offset);
    expect(assets).to.have.length(2);
    expect(assets[0]).to.have.property('assetTime').equal(1557925153);
    expect(assets[1]).to.have.property('assetTime').equal(1557925152);
  });

  it("get assets 'to' time in DESC order", async function () {
    let assetTime = testDataExplorer.tmTxData[0].txTime;
    let sortBy = 'DESC';
    let limit = 4;
    let offset = 0;
    let assets = await blockExplorer.getAssetToTime(assetTime, sortBy, limit, offset);
    expect(assets).to.have.length(4);
    expect(assets[0]).to.have.property('assetTime').equal(1557925153);
    expect(assets[1]).to.have.property('assetTime').equal(1557925152);
    expect(assets[2]).to.have.property('assetTime').equal(1557925151);
    expect(assets[3]).to.have.property('assetTime').equal(1557925150);
  });

  it("invalid time", async function () {
    await expect(blockExplorer.getAssetFromTime('assetTime')).to.be.rejected;
  });
});

describe('Retrieve blockchainInfo', () => {
  let blockExplorer;
  
  beforeEach(() => {
    blockExplorer = service(testDataExplorer.testServices);
  });
  it("Should fetch the net_info from tendermint", async function () {
    let serverUrl = 'http://localhost:26657'
    nock(serverUrl)      
    .get("/net_info")
    .reply(200, testDataExplorer.tendermintNetInfo);
    const rpcMethod = 'net_info';
    let rpcUrl = serverUrl+'/'+rpcMethod
    let blockchainInfoResult = await blockExplorer.getBlockchainInfo(rpcUrl);
    expect(blockchainInfoResult).to.have.deep.nested.property('result.peers[0]').equal(testDataExplorer.peer0);
  });

  it("Should Throw error",  async function () {
    let serverUrl = 'http://localhost:26657'
    nock(serverUrl)      
    .get("/net_info")
    .replyWithError('Error Occured.');
    const rpcMethod = 'net_info';
    let rpcUrl = serverUrl+'/'+rpcMethod;
    expect(blockExplorer.getBlockchainInfo(rpcUrl)).to.throw;
  });
});
