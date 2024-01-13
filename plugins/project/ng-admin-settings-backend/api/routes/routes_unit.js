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
        if (name == 'configService') {
          return {
            configService: {
              get: () => ''
            }
          }[name] || {};
        } else if (name == 'log4jsService') {
          return {
            log4jsService: {
              get: () => '',
              getLogLevel: () => ''
            }
          }[name] || {};
        }
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
      }
    };
    routes.init(server, 'test');
  });
  describe('status handler', () => {
    const req = {
      body: {
        userId: ''
      },
      user: {
        id: ''
      }

    };
    const res = {
      status: () => {
        return {
          end: () => {}
        };
      },
      send: () => {},
      json: () => {}
    };

    const pluginInstance = {
      config: {
        get: () => {
          return {
            get: () => {}
          };
        }
      }};

    it('route getConfig should be callable', () => {
      routes.getConfig(req, res, pluginInstance);
    });
    it('route getRequireFullName should be callable', () => {
      routes.getRequireFullName(req, res, pluginInstance);
    });
    it('route getSettings should be callable', () => {
      routes.getSettings(req, res, pluginInstance);
    });
    it('route getSystemSettingsEmail should be callable', () => {
      routes.getSystemSettingsEmail(req, res);
    });
    it('route getSystemSettingsLandscape should be callable', () => {
      routes.getSystemSettingsLandscape(req, res);
    });
    it('route getSystemSettingsSecurity should be callable', () => {
      routes.getSystemSettingsSecurity(req, res);
    });
    it('route getSystemSettingsSystem should be callable', () => {
      routes.getSystemSettingsSystem(req, res);
    });
    it('route postSystemSettingsEmail should be callable', () => {
      routes.postSystemSettingsEmail(req, res);
    });
    it('route postSystemSettingsLandscape should be callable', () => {
      routes.postSystemSettingsLandscape(req, res);
    });
    it('route postSystemSettingsSecurity should be callable', () => {
      routes.postSystemSettingsSecurity(req, res);
    });
    it('route postSystemSettingsSystem should be callable', () => {
      routes.postSystemSettingsSystem(req, res);
    });
  });
});
