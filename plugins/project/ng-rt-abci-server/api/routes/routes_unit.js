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

describe('routes', () => {
  const routes = require('./routes');

  let server;
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
    server = {
      plugin_manager: {
        configs: {
          get: key => ({
            'ng-rt-abci-server': {
              get: key => ({
                showRoutes: 'true'
              })[key]
            }
          })[key] // add config prop here
        },
        services
      }
    };
    routes.init(server, 'test');
  });

  describe('status handler', () => {
    it('handler info should be callable', () => {
      routes.info(req, res);
    });

    it.skip('handler status should be callable', () => {
      routes.status(req, res);
    });
  });

  describe('server GET request for info', () => {
    nock('http://localhost:8443')
      .get('/ng-rt-abci-server/info')
      .reply(200, {
        tmStatus: "Tendermint active",
        abciPort: "26658"
      });

    // wrong route retuns 404
    nock('http://localhost:8443')
      .get('/ng-rt-abci-server/invalidURL')
      .reply(404, {
        message: "not available"
      });

    it('should return code 200 with success Json', done => {
      const options = {
        method: 'get',
        url: 'http://localhost:8443/ng-rt-abci-server/info'
      };
      /* eslint-disable handle-callback-err */
      request(options, (err, res, body) => {
        if (res) {
          expect(res.statusCode).to.equal(200);
          expect(JSON.parse(body).tmStatus).to.equal("Tendermint active");
          expect(JSON.parse(body).abciPort).to.equal("26658");
        }
        done();
      });
    });

    it('should return code 404 with not-available json', done => {
      const options = {
        method: 'get',
        url: 'http://localhost:8443/ng-rt-abci-server/invalidURL'
      };
      request(options, (err, res, body) => {
        if (res) expect(res.statusCode).to.equal(404);
        done();
      });
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

    it('should return code 200 with success Json', done => {
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
  });
});
