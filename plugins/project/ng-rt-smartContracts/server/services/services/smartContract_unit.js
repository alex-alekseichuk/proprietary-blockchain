'use strict';

const sinonChai = require('sinon-chai');
// const sinon = require('sinon');
const chai = require('chai');
chai.should();
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(sinonChai);
var nock = require('nock');
const rewire = require('rewire');
const smartContract = rewire('./smartContract');
const assert = chai.assert;

const request = require('request');

let test = require('../../../test/test');

let scService = smartContract(test.services);

describe('smartContract', () => {
  describe('Basic test', () => {
    it('should have property: create', () => {
      expect(scService).to.have.property('create');
    });

    it('should have property: update', () => {
      expect(scService).to.have.property('updateCall');
    });

    it('should have property: getMemory', () => {
      expect(scService).to.have.property('getMemory');
    });

    it('should have property: getSource', () => {
      expect(scService).to.have.property('getSource');
    });

    it('should have property: updateTransfer', () => {
      expect(scService).to.have.property('updateTransfer');
    });

    it('should have property: publish', () => {
      expect(scService).to.have.property('publish');
    });

    it('should have property: call', () => {
      expect(scService).to.have.property('call');
    });

    it('should have property: transferCall', () => {
      expect(scService).to.have.property('transferCall');
    });

    it('should have property: getPublicPluginConfiguration', () => {
      expect(scService).to.have.property('getPublicPluginConfiguration');
    });
  });

  describe('Function to create a new contract. ', () => {
    it('When clientSigning = true', async function() {
      let pubKey = '481iwjYa7bmvjdG2K4LRqVjUF1Fgx8L1u362vRQhMcUD';
      let clientSigning = true;
      let source = [
				{id: 'feb536da.e74c18', type: 'done', z: 'c4ba12e4.5e20b', name: 'done', x: 990, y: 420, wires: []},
        {
          id: 'a3cfa134.a3b47',
          type: 'contract in',
          z: 'c4ba12e4.5e20b',
          name: 'init',
          url: '/helloWorld_Part1',
          method: 'get',
          swaggerDoc: '',
          x: 450,
          y: 300,
          wires: [['3ac6a2b2.8b808e']]
        },
        {
          id: '23071a54.684916',
          type: 'contract in',
          z: 'c4ba12e4.5e20b',
          name: 'getGreeting',
          url: '/getGreeting',
          method: 'get',
          swaggerDoc: '',
          x: 470,
          y: 420,
          wires: [['a70dbdc7.026b']]
        },
        {
          id: '7a30c4f5.8db6cc',
          type: 'smartContract-v1.0',
          z: 'c4ba12e4.5e20b',
          name: 'smartContract-v1.0',
          x: 490,
          y: 140,
          wires: []
        },
        {
          id: 'c759492b.567b78',
          type: 'done',
          z: 'c4ba12e4.5e20b',
          name: 'Published successfully',
          x: 1300,
          y: 300,
          wires: []
        },
        {
          id: '5f16301a.be17c',
          type: 'set-memory-field',
          z: 'c4ba12e4.5e20b',
          name: 'set memory field',
          field: 'greeting',
          source: 'greeting',
          x: 990,
          y: 300,
          wires: [['c759492b.567b78']]
        },
        {
          id: '71760035.9f27c',
          type: 'comment',
          z: 'c4ba12e4.5e20b',
          name: 'SC_HelloWorld_Part1',
          info: 'Saving data to memory.\n\nReading from memory.',
          x: 800,
          y: 140,
          wires: []
        },
        {
          id: '3ac6a2b2.8b808e',
          type: 'arguments',
          z: 'c4ba12e4.5e20b',
          name: 'get argument "greeting"',
          position: 0,
          destination: 'greeting',
          x: 730,
          y: 300,
          wires: [['5f16301a.be17c']]
        },
        {
          id: 'a70dbdc7.026b',
          type: 'get-memory-field',
          z: 'c4ba12e4.5e20b',
          name: 'get memory field',
          field: 'greeting',
          destination: 'payload',
          x: 720,
          y: 420,
          wires: [['feb536da.e74c18']]
        }
      ];

      let contractData = {
        creatorKey: '481iwjYa7bmvjdG2K4LRqVjUF1Fgx8L1u362vRQhMcUD',
        memory: {greeting: 'Hello'},
        source: source,
        sourceHash: '6d6a16237799cf067caaa6015cc18ecb',
        type: 'nodered'
      };

      let res = await scService.create(contractData, pubKey, clientSigning);

      expect(res).to.have.property('id').eql(null);
      expect(res).to.have.property('operation').eql('CREATE');
      expect(res).to.have.property('outputs');

      expect(res.outputs[0]).to.have.property('condition');
      expect(res.outputs[0]).to.have.property('amount').eql('1');
      expect(res.outputs[0]).to.have.property('public_keys');
      expect(res).to.have.property('inputs');
      expect(res).to.have.property('metadata');
      expect(res).to.have.property('asset');
      expect(res).to.have.property('version').eql('2.0');
    });

    it('When clientSigning = false', async function() {
      let pubKey = '481iwjYa7bmvjdG2K4LRqVjUF1Fgx8L1u362vRQhMcUD';
      let source = [
				{id: 'feb536da.e74c18', type: 'done', z: 'c4ba12e4.5e20b', name: 'done', x: 990, y: 420, wires: []},
        {
          id: 'a3cfa134.a3b47',
          type: 'contract in',
          z: 'c4ba12e4.5e20b',
          name: 'init',
          url: '/helloWorld_Part1',
          method: 'get',
          swaggerDoc: '',
          x: 450,
          y: 300,
          wires: [['3ac6a2b2.8b808e']]
        },
        {
          id: '23071a54.684916',
          type: 'contract in',
          z: 'c4ba12e4.5e20b',
          name: 'getGreeting',
          url: '/getGreeting',
          method: 'get',
          swaggerDoc: '',
          x: 470,
          y: 420,
          wires: [['a70dbdc7.026b']]
        },
        {
          id: '7a30c4f5.8db6cc',
          type: 'smartContract-v1.0',
          z: 'c4ba12e4.5e20b',
          name: 'smartContract-v1.0',
          x: 490,
          y: 140,
          wires: []
        },
        {
          id: 'c759492b.567b78',
          type: 'done',
          z: 'c4ba12e4.5e20b',
          name: 'Published successfully',
          x: 1300,
          y: 300,
          wires: []
        },
        {
          id: '5f16301a.be17c',
          type: 'set-memory-field',
          z: 'c4ba12e4.5e20b',
          name: 'set memory field',
          field: 'greeting',
          source: 'greeting',
          x: 990,
          y: 300,
          wires: [['c759492b.567b78']]
        },
        {
          id: '71760035.9f27c',
          type: 'comment',
          z: 'c4ba12e4.5e20b',
          name: 'SC_HelloWorld_Part1',
          info: 'Saving data to memory.\n\nReading from memory.',
          x: 800,
          y: 140,
          wires: []
        },
        {
          id: '3ac6a2b2.8b808e',
          type: 'arguments',
          z: 'c4ba12e4.5e20b',
          name: 'get argument "greeting"',
          position: 0,
          destination: 'greeting',
          x: 730,
          y: 300,
          wires: [['5f16301a.be17c']]
        },
        {
          id: 'a70dbdc7.026b',
          type: 'get-memory-field',
          z: 'c4ba12e4.5e20b',
          name: 'get memory field',
          field: 'greeting',
          destination: 'payload',
          x: 720,
          y: 420,
          wires: [['feb536da.e74c18']]
        }
      ];

      let clientSigning = 'false';
      let contractData = {
        creatorKey: '481iwjYa7bmvjdG2K4LRqVjUF1Fgx8L1u362vRQhMcUD',
        memory: {greeting: 'Hello'},
        source: source,
        sourceHash: '6d6a16237799cf067caaa6015cc18ecb',
        type: 'nodered'
      };

      let res = await scService.create(contractData, pubKey, clientSigning);
      res = res.resCommit;
      expect(res).to.have.property('id').eql(null);
      expect(res).to.have.property('result');
      expect(res.result).to.have.property('hash').eql(res.result.hash);
    });
  });

  describe('Funtion to read memory updateCall', () => {
    it('When clientSigning is true ', async () => {
      let pubKey = '481iwjYa7bmvjdG2K4LRqVjUF1Fgx8L1u362vRQhMcUD';
      let clientSigning = true;
      let args = ['Hello world'];
      const update = {
        address: 'cc5955bc87ca5736c46964576ed11b0148140f721ac0cf4bba7b948c63260778',
        caller: '481iwjYa7bmvjdG2K4LRqVjUF1Fgx8L1u362vRQhMcUD',
        contractType: 'nodered',
        functionName: 'changeGreeting',
        previousCallId: false,
        args: args,
        memory: {greeting: 'Hello World'}
      };

      let res = await scService.updateCall(update, pubKey, clientSigning);

      expect(res).to.have.property('id').eql(null);
      expect(res).to.have.property('operation').eql('CREATE');
      expect(res).to.have.property('outputs');
      expect(res.asset.data).to.have.property('contractUpdate');
      expect(res.outputs[0]).to.have.property('condition');
      expect(res.outputs[0]).to.have.property('amount').eql('1');
      expect(res.outputs[0]).to.have.property('public_keys');
      expect(res).to.have.property('inputs');
      expect(res).to.have.property('metadata');
      expect(res).to.have.property('asset');
      expect(res).to.have.property('version').eql('2.0');
    });
  });

  describe('getTx Function', () => {
    it('Reads an existing transaction', async function() {
      let scService = smartContract(test.services);
      const txId = '62972940c68bb94b28b430f75278e7bb0d815a036bc56680ad45ea1b87104018';
      const result = await scService.getTx(txId);
      assert.equal(result, test.tmTx[0].txData);
    });

    it('Reads a not existing transaction, throws error', async () => {
      const txId = '62972940c68bb94b28b430f75278e7bb0d815a036bc56680ad45ea1b87104018+Something';
      await expect(scService.getTx(txId)).to.be.rejected;
    });
  });

  describe('publish function ', () => {
    it('NodeRed request', done => {
      nock('http://127.0.0.1:8444')
      .get(
					'/redapi/helloWorld_Part2?args=hello&env=%7B%22caller%22:%229EUVhbKSAHMu8jRe5ZkBCCzaYhD3dTuhsrCL5DTJ8QUh%22,%22federationNodes%22:[%22127.0.0.1:8443%22]%7D'
        )
				.reply(200, test.publishResult
      );

      const options = {
        method: 'get',
        url: 'http://127.0.0.1:8444/redapi/helloWorld_Part1?args=hello&env={"caller":"9EUVhbKSAHMu8jRe5ZkBCCzaYhD3dTuhsrCL5DTJ8QUh","federationNodes":["127.0.0.1:8443"]}'
      };
      /* eslint-disable handle-callback-err */
      request(options, (err, res, body) => {
        if (res) {
          res = JSON.parse(body);
          expect(res.memory.greeting).to.equal('hey');
        }
        done();
      });
    });

    it('Publish', async function() {
      nock('http://127.0.0.1:8444')
      .get(
					'/redapi/helloWorld_Part2?args=hello&env=%7B%22caller%22:%229EUVhbKSAHMu8jRe5ZkBCCzaYhD3dTuhsrCL5DTJ8QUh%22,%22federationNodes%22:[%22127.0.0.1:8443%22]%7D'
        )
				.reply(200, test.publishResult
      );

      let templateName = 'SC_HelloWorld_Part2';
      let initArgs = 'hello';

      let pubKey = '9EUVhbKSAHMu8jRe5ZkBCCzaYhD3dTuhsrCL5DTJ8QUh';
      let clientSigning = true;

      let res = await scService.publish(templateName, initArgs, pubKey, clientSigning);

      expect(res).to.have.property('id').eql(null);
      expect(res).to.have.property('operation').eql('CREATE');
      expect(res).to.have.property('outputs');

      expect(res.outputs[0]).to.have.property('condition');
      expect(res.outputs[0]).to.have.property('amount').eql('1');
      expect(res.outputs[0]).to.have.property('public_keys');
      expect(res).to.have.property('inputs');
      expect(res).to.have.property('metadata');
      expect(res).to.have.property('asset');
    });
  });

  describe.skip('Call function ', () => {
    it('Call ', async function() {
      nock('http://127.0.0.1:8444')
      .get(
					'/redapi/helloWorld_Part2?args=hello&env=%7B%22caller%22:%229EUVhbKSAHMu8jRe5ZkBCCzaYhD3dTuhsrCL5DTJ8QUh%22,%22federationNodes%22:[%22127.0.0.1:8443%22]%7D'
        )
				.reply(200, test.publishResult
      );

      let contractId = '1234567890';
      let functionName = 'getGreeting';
      let functionArgs = ['false'];
      let callerPubKey = '481iwjYa7bmvjdG2K4LRqVjUF1Fgx8L1u362vRQhMcUD';
      let clientSigning = true;
      let remoteIp = '127.0.0.1';

      let res = await scService.call(
				contractId,
				functionName,
				functionArgs,
				callerPubKey,
				clientSigning,
				remoteIp
			);

      expect(res).to.have.property('id').eql(null);
      expect(res).to.have.property('operation').eql('CREATE');
      expect(res).to.have.property('outputs');
    });
  });

  describe.skip('TransferCall function ', () => {
    it('TransferCall ', async function() {
      nock('http://127.0.0.1:8444')
      .get(
					'/redapi/helloWorld_Part2?args=hello&env=%7B%22caller%22:%229EUVhbKSAHMu8jRe5ZkBCCzaYhD3dTuhsrCL5DTJ8QUh%22,%22federationNodes%22:[%22127.0.0.1:8443%22]%7D'
        )
				.reply(200, test.publishResult
      );

      let data = {
        amount: '1',
        args: false,
        assetId: '62972940c68bb94b28b430f75278e7bb0d815a036bc56680ad45ea1b87104018',
        assetPubKey: 'BC7WGR8i6Z1vYjPd5xxEmr8uAo9r3BUmCFLfLr6j35v',
        clientSigning: 'true',
        contractId: '1d718b9d5ab41a1ef9d997a17ab6dd70781b346db720dc7cf4d09c477ba9aec2',
        functionName: 'transferVehicle',
        latestTxId: '62972940c68bb94b28b430f75278e7bb0d815a036bc56680ad45ea1b87104018',
        nextOwner: 'D5wUunZ7AgDN1f5K42puUj6mqj5LFCunjVwxRzLEBnGW',
        output: 0,
        remoteIp: '127.0.0.1'
      };

      let res = await scService.transferCall(data);

      expect(res).to.have.property('id').eql(null);
      expect(res).to.have.property('operation').eql('CREATE');
      expect(res).to.have.property('outputs');
    });
  });

  describe('getMemory function ', () => {
    it('getMemory ', async function() {
      let contractId = '1d718b9d5ab41a1ef9d997a17ab6dd70781b346db720dc7cf4d09c477ba9aec2';

      let res = await scService.getMemory(test.services.get('loopbackApp').models, contractId);

      expect(res).to.have.property('greeting');
    });
  });

  describe('getSource function ', () => {
    it('Reads contract source', async function() {
      const contractId = '1d718b9d5ab41a1ef9d997a17ab6dd70781b346db720dc7cf4d09c477ba9aec2';
      let result = await scService.getSource(contractId);
			// result = JSON.parse(result);

      assert.equal(result, test.tmTx[8].txData.asset.data.contractCreation.source);
    });
  });

  describe('getPublicPluginConfiguration function ', () => {
    it('Reads plugin public info', async function() {
      let result = await scService.getPublicPluginConfiguration(
				test.server.plugin_manager.configs.get('ng-rt-smartContracts')
			);
      expect(result).to.have.property('routeValidation');
    });
  });

  describe('executeWithoutTab function ', () => {
    it('Reads execution strategy', async function() {
      nock('http://127.0.0.1:8444')
				.get(
					'/redapi/changeGreeting?world_memory=%7B%22greeting%22:%22hhhhiiiii%22%7D&args=test&env=%7B%22caller%22:%22481iwjYa7bmvjdG2K4LRqVjUF1Fgx8L1u362vRQhMcUD%22,%22ownContractId%22:%221d718b9d5ab41a1ef9d997a17ab6dd70781b346db720dc7cf4d09c477ba9aec2%22,%22federationNodes%22:%5B%22127.0.0.1:8443%22%5D,%22ownIp%22:%22http%22,%22http%22:%7B%22remote%22:%7B%22ip%22:%22127.0.0.1%22%7D%7D%7D&transferData=%7B%7D'
				)
				.reply(200, test.nodeRedResult);

      const contractId = '1d718b9d5ab41a1ef9d997a17ab6dd70781b346db720dc7cf4d09c477ba9aec2';
      let scService = smartContract(test.services);
      let functionName = 'changeGreeting';
      let functionArgs = ['test'];
      let callerPubKey = '481iwjYa7bmvjdG2K4LRqVjUF1Fgx8L1u362vRQhMcUD';
      let remoteIp = '127.0.0.1';

      let res = await scService.executeWithoutTab(
				contractId,
				functionName,
				functionArgs,
				callerPubKey,
				remoteIp,
				false
			);

      res = JSON.parse(res);

      expect(res).to.have.property('allowTransfer').eql(null);
      expect(res).to.have.property('changeAsset');
      expect(res).to.have.property('memory');
      expect(res).to.have.property('result');
      expect(res.memory).to.have.property('assetId').eql('b82628bd8800b1dc87189aca575867875d0fa41f804bc1595ffc23cda0319d6b');
      expect(res.memory).to.have.property('lastInspectionDate').eql('2020-1-1');
      expect(res.result).to.have.property('args');
      expect(res.result).to.have.property('env');
      expect(res.result.env).to.have.property('ownContractId').eql('1a3dbb345b08932d19639ba2cbd6d62a8d5e0083c97efeb9fdb4cbecdc6cb42c');
      expect(res.result).to.have.property('transferData');
    });
  });
});
