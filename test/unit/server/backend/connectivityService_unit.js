'use strict';
const proxyquire = require('proxyquire').noCallThru();
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const log4jsMock = {
  getLogger() {
    return {
      info() {},
      warn() {},
      debug() {},
      error() {},
      trace() {}
    };
  }
};

const i18nMock = {
  __: sinon.stub()
};
const servicesStub = {
  get: sinon.stub().returns(true)
};
const configServiceMock = {
  get: sinon.stub()
};

const connectRethinkDBSpy = sinon.spy();
const connectBigchainDBSpy = sinon.spy();
const connectRabbitMQSpy = sinon.spy();

const {check} = proxyquire('../../../../server/backend/connectivityService', {
  'log4js': log4jsMock,
  './rethinkdb': {connect: connectRethinkDBSpy},
  './bigchaindb': {connect: connectBigchainDBSpy},
  './rabbitMQ': {connect: connectRabbitMQSpy}
});

describe(`In server/backend/connectivityService.js:`, () => {
  describe('check function', () => {
    let argv;

    beforeEach(() => {
      configServiceMock.get.returns('rethinkdb');
      connectBigchainDBSpy.resetHistory();
      connectRabbitMQSpy.resetHistory();
      connectRethinkDBSpy.resetHistory();
      argv = {};
    });

    it('SHOULD check all possible connections by default', done => {
      expect(connectBigchainDBSpy).to.not.been.called;
      expect(connectRabbitMQSpy).to.not.been.called;
      expect(connectRethinkDBSpy).to.not.been.called;
      check(servicesStub, configServiceMock, argv, i18nMock)
        .then(() => {
          expect(connectBigchainDBSpy).to.have.been.calledOnce;
          expect(connectRabbitMQSpy).to.have.been.calledOnce;
          expect(connectRethinkDBSpy).to.have.been.calledOnce;
          done();
        })
        .catch(done);
    });

    it('SHOULD NOT check any connections if --skipAllConnectivityTests argument provided', done => {
      argv.skipAllConnectivityTests = true;
      check(servicesStub, configServiceMock, argv, i18nMock)
        .then(() => {
          expect(connectBigchainDBSpy).to.not.been.called;
          expect(connectRabbitMQSpy).to.not.been.called;
          expect(connectRethinkDBSpy).to.not.been.called;
          done();
        })
        .catch(done);
    });

    it('SHOULD NOT check RethinkDB connection if --skipConnectivityTestRethinkDB argument provided', done => {
      argv.skipConnectivityTestRethinkDB = true;
      check(servicesStub, configServiceMock, argv, i18nMock)
        .then(() => {
          expect(connectRethinkDBSpy).to.not.been.called;
          done();
        })
        .catch(done);
    });

    it('SHOULD NOT check BigchainDB connection if --skipConnectivityTestBigchainDB argument provided', done => {
      argv.skipConnectivityTestBigchainDB = true;
      check(servicesStub, configServiceMock, argv, i18nMock)
        .then(() => {
          expect(connectBigchainDBSpy).to.not.been.called;
          done();
        })
        .catch(done);
    });

    it('SHOULD NOT check RabbitMQ connection if --skipConnectivityTestRabbitMQ argument provided', done => {
      argv.skipConnectivityTestRabbitMQ = true;
      check(servicesStub, configServiceMock, argv, i18nMock)
        .then(() => {
          expect(connectRabbitMQSpy).to.not.been.called;
          done();
        })
        .catch(done);
    });
  });
});
