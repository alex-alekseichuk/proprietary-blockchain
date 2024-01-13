/**
 * Test Vault backend methods.
 * These tests are skipped for now, because `node-vault` module is excluded from dependencies.
 */
'use strict';

const path = require('path');
const proxyquire = require('proxyquire');
const sinon = require("sinon");
global.appBase = path.resolve(__dirname, '../../../..'); // root path for ng-rt
const sinonChai = require("sinon-chai");
const chai = require('chai');
chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe.skip('vault backend', () => {
  const configServiceMock = {
    get: sinon.stub()
  };
  const i18nMock = {
    __: sinon.stub()
  };

  const connMock = {
    userpassLogin: sinon.stub().resolves({auth: {client_token: 'token'}}),
    write: sinon.stub(),
    read: sinon.stub().resolves({data: 'record'}),
    list: sinon.stub().resolves({data: {keys: 'keys'}})
  };

  const vaultFactory = proxyquire(path.join(global.appBase, 'server/backend/vault'), {
    'node-vault': () => connMock
  });
  const vaultService = vaultFactory(configServiceMock, i18nMock);

  beforeEach(() => {
    connMock.userpassLogin.resetHistory();
    connMock.write.resetHistory();
    connMock.read.resetHistory();
    connMock.list.resetHistory();
  });
  describe('login method', () => {
    it('SHOULD return token', () =>
      vaultService.login('userId', 'password').should.be.eventually.equal('token')
    );
    it('SHOULD call userpassLogin with userId and password', () =>
      vaultService.login('userId', 'password').should.be.fulfilled.then(() =>
        connMock.userpassLogin.should.be.calledWithMatch({username: 'userId', password: 'password'})
      )
    );
  });

  describe('write method', () => {
    it('SHOULD call write with params', () => {
      vaultService.write('token', 'userId', 'key', 'record');
      connMock.write.should.be.calledWithMatch('key', 'record');
    });
  });

  describe('read method', () => {
    it('SHOULD return record', () =>
      vaultService.read('token', 'userId', 'key').should.be.eventually.equal('record')
    );
    it('SHOULD call read with key', () =>
      vaultService.read('token', 'userId', 'key').should.be.fulfilled.then(() =>
        connMock.read.should.be.calledWithMatch('key')
      )
    );
  });

  describe('listKeys method', () => {
    it('SHOULD return record', () =>
      vaultService.listKeys('token', 'userId', 'key').should.be.eventually.equal('keys')
    );
    it('SHOULD call list with key', () =>
      vaultService.listKeys('token', 'userId', 'key').should.be.fulfilled.then(() =>
        connMock.list.should.be.calledWithMatch('key')
      )
    );
  });
});
