'use strict';
// const sinon = require("sinon");
// require('sinon-as-promised');
const sinonChai = require("sinon-chai");
const chai = require('chai');
chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('routes', () => {
  const routes = require('./routes');

  let server;
  let services;
  beforeEach(() => {
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
          get: () => {
            return {
              get: () => {}
            };
          }
        },
        services
      },
      models: {
        log: {
          count: () => {
            return Promise.resolve({});
          },
          find: () => {
            return Promise.resolve({});
          }
        },
      }
    }
    routes.init(server, 'test');
  });
  describe('status handler', () => {
    const req = {
      body: {
        limit: '',
        skip: '',
        where: '',
        log: ''
      }

    };
    const res = {
      status: () => res,
      send: () => {},
      json: () => {}
    };
    it('route postLog should be callable', () => {
      routes.postLog(req, res);
    });
    it('route postLogCount should be callable', () => {
      routes.postLogCount(req, res);
    });
  });
});
