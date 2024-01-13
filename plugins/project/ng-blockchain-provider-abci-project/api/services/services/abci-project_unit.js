'use strict';

const sinon = require('sinon');
const sinonChai = require("sinon-chai");
const rewire = require("rewire");
const service = rewire('./abci-project.js');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const request = require('request-promise');

const testData = require('../../../test/testData.js');
const testDataOutputs = require('../../../test/testDataGetOutputs');
const testDataHistory = require('../../../test/testDataGetHistory');
const testDataAssetByOwner = require('../../../test/testDataGetAssetByOwner');
const testDataCurrentOwner = require('../../../test/testDataGetCurrentOwner');
const testDatafindTxByProperty = require('../../../test/testDatafindTxByProperty');

chai.should();

chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;
const assert = chai.assert;

describe('Test abci-project', () => {
  let abciProject;
  beforeEach(() => {
    abciProject = service(testDataHistory._services);
  });

  afterEach(()=>{
    sinon.restore() // to reset the fakes
  })

  it("resolving tx method", done => {
    let txMethod = service.__get__('resolveTendermintTxType');
    let method = 'Async';
    let result = txMethod(method);
    expect(result).to.be.equal('broadcast_tx_async');
    done();
  });

  it("post tx", async() => {
    let fakeResult = sinon.fake.resolves('test done');
    sinon.replace(request, 'Request', fakeResult);
    // let postTx = service.__get__('postTx');
    let txData = {
      testdata: 'data'
    };
    let assetDescriptor = {
      assetType: 'tendermint_blob',
      assetFormat: 'TEST FORMAT'
    };
    let metadata = 'test Metadata';
    let serverUrl = 'localhost:8443';
    let method = 'Async';
    let result = await abciProject.postTx(txData, metadata, assetDescriptor, method, serverUrl);
    expect(result).to.be.equal('test done');
  });
});

// Users: alice, bob, charlie, dora
// Assets: car1, car2

// Alice creates Car 1
// Bob creates Car 2

// Charlie creates book 1
// Dora creates book 2
// Bob creates book 3

// Alice transfers Car 1 to Charlie
// Bob transfers Car 2 to Alice
// Charlie transfers book 1 to Bob
// Bob transfers book 3 to Dora
// Dora transfers book 2 to Alice

describe('Test getTxHistory()', () => {
  let abciProject;
  beforeEach(() => {
    abciProject = service(testDataHistory._services);
  });

  it('Get History of car asset for alice', async() => {
    // 1. In Car 1 (create)
    // 2. Out Car 1 (to Charlie)
    // 3. In Car 2 (from Bob)

    const {users, transactions} = testDataHistory;
    const history = await abciProject.getTxHistory(users.alice.publicKey, 'car');

    expect(history.length).to.be.equal(3);

    expect(history.filter(entry => entry.direction === 'create').length).to.be.equal(1);
    expect(history.filter(entry => entry.direction === 'in').length).to.be.equal(1);
    expect(history.filter(entry => entry.direction === 'out').length).to.be.equal(1);

    history.forEach(entry => {
      expect(entry.from).to.be.an('array');
      expect(entry.to).to.be.an('array');
      expect(entry.from.length).to.be.equal(1);
      expect(entry.to.length).to.be.equal(1);
    });

    // check order of history entries (sorted by timestamp)
    expect(history[0].txId).to.be.equal(transactions[0].txId);
    expect(history[1].txId).to.be.equal(transactions[5].txId);
    expect(history[2].txId).to.be.equal(transactions[6].txId);

    // check 'from' and 'to' values
    expect(history[0].from[0]).to.be.equal(users.alice.publicKey);
    expect(history[0].to[0]).to.be.equal(users.alice.publicKey);

    expect(history[1].from[0]).to.be.equal(users.alice.publicKey);
    expect(history[1].to[0]).to.be.equal(users.charlie.publicKey);

    expect(history[2].from[0]).to.be.equal(users.bob.publicKey);
    expect(history[2].to[0]).to.be.equal(users.alice.publicKey);
  });

  it('Get History of book asset for alice', async() => {
    // 1. In book 2 (from Dora)

    const {users, transactions} = testDataHistory;
    const history = await abciProject.getTxHistory(users.alice.publicKey, 'book');

    history.forEach(entry => {
      expect(entry.from).to.be.an('array');
      expect(entry.to).to.be.an('array');
      expect(entry.from.length).to.be.equal(1);
      expect(entry.to.length).to.be.equal(1);
    });

    expect(history.length).to.be.equal(1);

    expect(history.filter(entry => entry.direction === 'in').length).to.be.equal(1);

    expect(history[0].txId).to.be.equal(transactions[9].txId);

    expect(history[0].from[0]).to.be.equal(users.dora.publicKey);
    expect(history[0].to[0]).to.be.equal(users.alice.publicKey);
  });
});

describe('Test getAssetHistory()', () => {
  let abciProject;
  beforeEach(() => {
    abciProject = service(testDataHistory._services);
  });

  it('Get History of car asset ', async() => {
    const {users, assets, transactions} = testDataHistory;
    const bmwAsset = assets[0];

    const history = await abciProject.getAssetHistory(bmwAsset.txId);

    expect(history.length).to.be.equal(2);

    history.forEach(entry => {
      expect(entry.from).to.be.an('array');
      expect(entry.to).to.be.an('array');
      expect(entry.from.length).to.be.equal(1);
      expect(entry.to.length).to.be.equal(1);
    });

    // check order of history entries (sorted by timestamp)
    expect(history[0].txId).to.be.equal(transactions[0].txId);
    expect(history[1].txId).to.be.equal(transactions[5].txId);

    // check correct ownership...
    expect(history[0].from[0]).to.be.equal(users.alice.publicKey);
    expect(history[0].to[0]).to.be.equal(users.alice.publicKey);

    expect(history[1].from[0]).to.be.equal(users.alice.publicKey);
    expect(history[1].to[0]).to.be.equal(users.charlie.publicKey);
  });
});

// unit test cases for getTxById and getAssetById
describe('get Tx and get asset using txId', () => {
  let abciProject;
  beforeEach(() => {
    abciProject = service(testData._services);
  });

  it('get tx using transaction Id', async() => {
    const id = 'transactionId';
    const tx = await abciProject.getTxById(id);
    expect(tx).to.have.property('txId').equal('c0bc739224634ec184be079e272ac84c17d68fdf34ce74607b565f316841d743');
    expect(tx).to.have.property('txData');
  });

  it('Reject when transaction id is undefined', async() => {
    const id = undefined;
    await expect(abciProject.getTxById(id)).to.be.rejected;
  });

  it('Reject when transaction id is null', async() => {
    const id = null;
    await expect(abciProject.getTxById(id)).to.be.rejected;
  });

  it('get asset using assetId', async() => {
    const id = 'transactionId';
    const tx = await abciProject.getAssetById(id);
    expect(tx).to.have.property('txId').equal('c0bc739224634ec184be079e272ac84c17d68fdf34ce74607b565f316841d743');
    expect(tx).to.have.property('type').equal('tendermint_blob');
    expect(tx).to.have.property('format');
    expect(tx).to.have.property('data');
  });

  it('Reject when asset id is undefined', async() => {
    const id = undefined;
    await expect(abciProject.getAssetById(id)).to.be.rejected;
  });

  it('Reject when asset id is null', async() => {
    const id = null;
    await expect(abciProject.getAssetById(id)).to.be.rejected;
  });
});

// unit test cases for getBalance
describe('service', () => {
  let abciProject;
  beforeEach(() => {
    abciProject = service(testData._services);
  });

  it('should have correct response property', async() => {
    const {publicKey, assetType} = testData.requestData;
    const bal = await abciProject.getBalance(publicKey, assetType);
    expect(bal).equals(100);
  });
});

describe('Spy', () => {
  let abciProject;
  let getBalanceSpy;

  beforeEach(() => {
    abciProject = service(testData._services);
    getBalanceSpy = sinon.spy(abciProject, "getBalance");
  });

  it('should call getBalance method', async() => {
    const {publicKey, assetType} = testData.requestData;
    await getBalanceSpy(publicKey, assetType);
    assert(getBalanceSpy.called);
    assert(getBalanceSpy.calledOnce);
    assert(getBalanceSpy.alwaysCalledWithExactly(publicKey, assetType));
  });
});

// Unit test cases for getOutputs
describe('test getOutputs()', () => {
  let abciProject;
  beforeEach(() => {
    abciProject = service(testDataOutputs._services);
  });

  it('get outputs', async() => {
    const {publicKey, assetType} = testDataOutputs.requestData;
    const result = await abciProject.getOutputs(publicKey, assetType);

    expect(result.length).to.be.equal(1);

    const output = result[0];
    const asset = output.tx.get().asset.get();
    expect(asset).to.have.property('type').equal(assetType);
  });

  it('get outputs if no tx found', async() => {
    const publicKey = '7dHggWxQdfNptmNBeEUGiM4g8ayeD8Q2JLUjwvWDeb46';
    const assetType = 'tendermint_blob';

    const result = await abciProject.getOutputs(publicKey, assetType);

    expect(result.length).to.be.equal(0);
  });
});

// unit test cases for getInputs
describe('Test getInputs()', () => {
  let getInputs;
  beforeEach(() => {
    getInputs = service.__get__('getInputs'); // TO require getInputs since it's not exported in abci-project.js
  });

  it('get inputs', async() => {
    const {publicKey, assetType} = testData.requestData;
    const inputs = await getInputs(publicKey, assetType);
    const tx = inputs[0].tx.get();
    expect(inputs[0].txId).equals('d9d3b300a30289baf52607eb2ce6f409a7788ddea493cc62d56db306b0c2a8cd');
    expect(tx.txData).to.have.property('operation');
    expect(tx.txData).to.have.property('outputs');
    expect(tx.txData).to.have.property('inputs');
    expect(tx.txData).to.have.property('version');
    expect(tx.txData).to.have.property('metadata');
    expect(tx.txData).to.have.property('asset');
    expect(tx).to.have.property('assetType');
    expect(tx).to.have.property('assetFormat');
  });

  it('get inputs if no tx found', async() => {
    const publicKey = '7dHggWxQdfNptmNBeEUGiM4g8ayeD8Q2JLUjwvWDeb46';
    const assetType = 'tendermint_blob';
    const result = await getInputs(publicKey, assetType);
    expect(result).to.be.eql([]);
  });
});

// Unit test cases for getInputsAndOutputs
describe('test getInputsAndOutputs()', () => {
  let abciProject;
  beforeEach(() => {
    abciProject = service(testDataHistory._services);
  });

  it('get inuts and outputs for asset car of alice', async() => {
    const {users} = testDataHistory;
    const result = await abciProject.getInputsAndOutputs(users.alice.publicKey, 'car');

    expect(result.inputs.length).to.be.equal(1);
    expect(result.outputs.length).to.be.equal(2);
  });
});

// unit test cases for getAssetsByOwner
describe('Test getAssetsByOwner()', () => {
  let abciProject;
  beforeEach(() => {
    abciProject = service(testDataAssetByOwner._services);
  });

  it('get all assets true', async() => {
    const publicKey = "GYJSQ26pB24mwafXbMLpsjgD3QLS8oaKbjmnSPbiWBWB";
    const assetType = 'tendermint_blob';
    const assets = await abciProject.getAssetsByOwner(publicKey, assetType);
    expect(assets[0].data).to.have.property('serialNumber').eql('56288320528682648929801');
    expect(assets[0].data).to.have.property('Type').eql('car');
    expect(assets[0].data).to.have.property('modelName').eql('BMW x');
    expect(assets[0].data).to.have.property('registrationYear').eql('2019');
    expect(assets[0].data).to.have.property('colour').eql('black');
    expect(assets[0].data).to.have.property('numberOfDoors').eql('3');
    expect(assets[0].data).to.have.property('fueltype').eql('Diesel');
    expect(assets[0].data).to.have.property('time').eql('1561971470219');
  });

  it('get all assets true', async() => {
    const publicKey = "2SRYD7njZV28cWtN8b6hioDrftUXKemDY6v2wuoWZrAW";
    const assetType = 'tendermint_blob';
    const assets = await abciProject.getAssetsByOwner(publicKey, assetType);
    expect(assets[0].data).to.have.property('serialNumber').eql('56288320528682648929801');
    expect(assets[0].data).to.have.property('Type').eql('car');
    expect(assets[0].data).to.have.property('modelName').eql('BMW x');
    expect(assets[0].data).to.have.property('registrationYear').eql('2019');
    expect(assets[0].data).to.have.property('colour').eql('black');
    expect(assets[0].data).to.have.property('numberOfDoors').eql('3');
    expect(assets[0].data).to.have.property('fueltype').eql('Diesel');
    expect(assets[0].data).to.have.property('time').eql('1562053828020');
  });

  it('get all assets false', async() => {
    const publicKey = '3PtBLYHY9n3KEr5KeSQ5RQiQXGUkesa6Vvqvk3KTEfN3';
    const assetType = 'tendermint_blob';
    const assets = await abciProject.getAssetsByOwner(publicKey, assetType);
    expect(assets).to.be.eql([]);
  });
});

// unit test cases for getCurrentOwner
describe('Test getOwnerOfAsset()', () => {
  let abciProject;
  beforeEach(() => {
    abciProject = service(testDataCurrentOwner._services);
  });

  it('get current owner true', async() => {
    let result = {ownerPublicKey: ['GYJSQ26pB24mwafXbMLpsjgD3QLS8oaKbjmnSPbiWBWB'], timestamp: 1562320740462};
    const assetId = "e431f434e8ba6c086c20f7772055a9e636cef0b2f930d8a25a6184b116ca8f28";
    const owner = await abciProject.getOwnerOfAsset(assetId);
    assert.deepEqual(owner, result);
  });

  it('Reject when asset id is undefined', async() => {
    const assetId = undefined;
    await expect(abciProject.getOwnerOfAsset(assetId)).to.be.rejected;
  });
});

// find txs using metadata
describe('Test findTxByProperty()', () => {
  let abciProject;
  beforeEach(() => {
    abciProject = service(testDatafindTxByProperty._services);
  });

  it('find txs using property exist', async() => {
    const {transactions} = testDatafindTxByProperty;
    const clientMetadata = {
      clientId: "test"
    };
    const txs = await abciProject.findTxByProperty(clientMetadata);
    assert.deepEqual(transactions, txs);
  });
});

// find asset by metadata property
describe('Test findAssetByProperty()', () => {
  let abciProject;
  beforeEach(() => {
    abciProject = service(testDatafindTxByProperty._services);
  });
  it('find assets using property exist', async() => {
    const {assets} = testDatafindTxByProperty;
    const clientMetadata = {
      clientId: "test"
    };
    const res = await abciProject.findAssetByProperty(clientMetadata);
    assert.deepEqual(assets, res);
  });
});
