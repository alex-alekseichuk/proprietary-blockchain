'use strict';
const {
  spy,
  stub
} = require('sinon');
const chai = require('chai');
chai.should();
const expect = chai.expect;
const request = require('request');
var nock = require('nock');
const sinon = require('sinon');
const testData = require('../../test/testData.js');
let mockery = require('mockery');

mockery.enable({
  warnOnReplace: false,
  warnOnUnregistered: false,
  useCleanCache: true
});
describe('routes', () => {
  const routes = require('./tmroutes');

  let serverStub;
  let services;
  let status;
  let send;
  let json;
  let res;
  let req;

  beforeEach(() => {
    status = stub();
    send = stub();
    json = spy();
    res = {
      json,
      status,
      send,
      sendStatus: function(status) {}
    };
    req = {};
    // status.returns(res);
    //
    services = {
      get: name => {
        return {
          i18n: {
            __: () => ''
          }
        }[name] || {};
      }
    };
    serverStub = {
      plugin_manager: {
        configs: {
          get: key => ({
            'ng-rt-abci-server': {
              get: key => ({
                showRoutes: 'test',
                namespace: 'test',
                tendermintUrl: 'test',
                tendermintPort: 'test'
              })[key]
            }
          })[key] // add config prop here
        },
        services
      }
    };
    routes.init(serverStub, 'test');
  });

  describe('status handler', () => {
    it.skip('handler status should be callable', () => {
      routes.status(req, res);
    });
  });

  describe('functions call', () => {
    it('init called-true', () => {
      routes.init(serverStub, 'test');
    });
  });
  let server = testData.server;

  describe('server.get call', () => {
    beforeEach(() => {
      sinon.stub(server, 'get').returns('test');
    });

    afterEach(() => {
      server.get.reset();
    });

    it('routes called-true', () => {
      routes.activate(server, 'test', 'test');
    });
  });
  mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
  });

  let rp;
  let pluginSettings = testData.server.plugin_manager.configs.get('ng-rt-abci-server');
  let reqStub = {route: {path: {split: function() {
    return 'test';
  }}}};
  let resStub = {status: () => '',
    json: err => 'err'};

  describe(' route call', () => {
    beforeEach(() => {
      rp = sinon.stub().resolves().returns({
        then: function(json) {
          return '';
        },
        error: function() {}
      });
      sinon.stub(pluginSettings, 'get').returns('test');
      mockery.registerMock('request-promise', rp);
    });

    afterEach(() => {
      rp.reset();
      mockery.deregisterMock('request-promise');
      pluginSettings.get.reset();
    });

    it('route activate called-true', () => {
      routes.tmroute(reqStub, resStub);
    });
  });

  // correct route returns 200
  describe('server GET request for route status', () => {
    nock('http://localhost:31443')
      .get('/ng-rt-abci-server/status')
      .reply(200, {
        tmStatus: "Route not activated"
      });

    // beibg called in ng-rt-abci-server/status
    nock('http://172.17.0.1:26657/status')
      .get('/status')
      .reply(200, {
        tmStatus: "All good"
      });

    nock('http://localhost:31443')
      .get('/ng-rt-abci-server/net_info')
      .reply(200, {
        tmStatus: "Route not activated"
      });

    // beibg called in ng-rt-abci-server/status
    nock('http://172.17.0.1:26657/net_info')
      .get('/net_info')
      .reply(200, {
        tmStatus: "All good"
      });

    nock('http://localhost:31443')
      .get('/ng-rt-abci-server/num_unconfirmed_txs')
      .reply(200, {
        tmStatus: "Route not activated"
      });

    // beibg called in ng-rt-abci-server/status
    nock('http://172.17.0.1:26657/num_unconfirmed_txs')
      .get('/num_unconfirmed_txs')
      .reply(200, {
        tmStatus: "All good"
      });

    nock('http://localhost:31443')
      .get('/ng-rt-abci-server/genesis')
      .reply(200, {
        tmStatus: "Route not activated"
      });

    // beibg called in ng-rt-abci-server/status
    nock('http://172.17.0.1:26657/genesis')
      .get('/status')
      .reply(200, {
        tmStatus: "All good"
      });

    it('should return code 200 with success Json - status ', done => {
      const options = {
        method: 'get',
        url: 'http://localhost:31443/ng-rt-abci-server/status'
      };
      /* eslint-disable handle-callback-err */
      request(options, (err, res, body) => {
        expect(res.statusCode).to.equal(200);
        done();
      });
    });

    it('should return code 200 with success Json - genesis', done => {
      const options = {
        method: 'get',
        url: 'http://localhost:31443/ng-rt-abci-server/genesis'
      };
      /* eslint-disable handle-callback-err */
      request(options, (err, res, body) => {
        expect(res.statusCode).to.equal(200);
        done();
      });
    });

    it('should return code 200 with success Json - num_unconfirmed_txs', done => {
      const options = {
        method: 'get',
        url: 'http://localhost:31443/ng-rt-abci-server/num_unconfirmed_txs'
      };
      /* eslint-disable handle-callback-err */
      request(options, (err, res, body) => {
        expect(res.statusCode).to.equal(200);
        done();
      });
    });

    it('should return code 200 with success Json - net_info', done => {
      const options = {
        method: 'get',
        url: 'http://localhost:31443/ng-rt-abci-server/net_info'
      };
      /* eslint-disable handle-callback-err */
      request(options, (err, res, body) => {
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
  });
});
