'use strict';

const sinonChai = require("sinon-chai");
const chai = require('chai');
chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;
const assert = chai.assert;

const initConfig = {

};

const getDeepObjectField = field => {
  let delimeter = field.indexOf('.') > -1 ? '.' : (field.indexOf(':') > -1 ? ':' : null);
  if (!delimeter)
    return;
  let fields = field.split(delimeter);
  return fields;
};

const getDeepObjectFieldValue = (fields, value) => {
  if (typeof value === 'undefined')
    return;
  if (fields.length === 0)
    return value;
  let field = fields.shift();
  return getDeepObjectFieldValue(fields, value[field]);
};

const assets = {
  onadd: {
    id: '0',
    data: {
      type: 'config_feed',
      operation: 'add',
      field: 'TEST_FIELD_NAME',
      value: 'TEST_FIELD_VALUE',
      producerId: '1'
    }
  },
  onaddmultiple: {
    id: '1',
    data: {
      type: 'config_feed',
      operation: 'addmultiple',
      conf: {
        'TEST_FIELD_NAME1': 'TEST_FIELD_VALUE1',
        'TEST_FIELD_NAME2': 'TEST_FIELD_VALUE2'
      },
      producerId: '1'
    }
  },
  onaddplugin: {
    id: '2',
    data: {
      type: 'config_feed',
      operation: 'add',
      field: 'PLUGIN_TEST_FIELD_NAME',
      value: 'PLUGIN_TEST_FIELD_VALUE',
      plugin: 'TEST_PLUGIN',
      producerId: '1'
    }
  },
  onaddmultipleplugin: {
    id: '1',
    data: {
      type: 'config_feed',
      operation: 'addmultiple',
      conf: {
        'PLUGIN_TEST_FIELD_NAME1': 'PLUGIN_TEST_FIELD_VALUE1',
        'PLUGIN_TEST_FIELD_NAME2': 'PLUGIN_TEST_FIELD_VALUE2'
      },
      plugin: 'TEST_PLUGIN',
      producerId: '1'
    }
  },
}

const getMessage = assetName => {
  if (assets[assetName])
    return {
      message: {
        txId: assets[assetName].id
      }
    };
  return;
}

const configServiceFactory = (initialConfig, _plugin) => {
  let configServicesAdded = [];
  let configServicesAddedMultiple = [];
  let CONFIG = { ...initialConfig };
  const _onAddCalbacks = [];
  const _onAddMulttipleCallbacks = [];
  return {
    get: name => {
      let fields = getDeepObjectField(name);
      if (!fields)
        return CONFIG[name];
      let rootField = fields.shift();
      return getDeepObjectFieldValue(fields, CONFIG[rootField]);
    },
    set: (name, value) => {
      configServicesAdded.push({ name, value });
    },
    add: (name, value) => {
      configServicesAdded.push({ name, value });
    },
    addMultiple: conf => {
      configServicesAddedMultiple.push(conf);
    },
    onadd: callback => {
      _onAddCalbacks.push(callback);
    },
    onaddmultiple: callback => {
      _onAddMulttipleCallbacks.push(callback);
    },
    reset: () => {
      CONFIG = { ...initConfig };
      configServicesAdded = [];
      configServicesAddedMultiple = [];
    },
    get added() {
      return configServicesAdded;
    },
    get addedMultiple() {
      return configServicesAddedMultiple;
    },
    get plugin() {
      return _plugin;
    },
    get onAddCalbacks() {
      return _onAddCalbacks
    },
    get onAddMulttipleCallbacks() {
      return _onAddMulttipleCallbacks;
    }
  }
}

const servicesFactory = () => {
  let rabbitMQSubscribers = {};
  let rabbitMQPublishers = {};

  let createdDigitalAssets = [];

  let services = {
    configService: configServiceFactory(initConfig),
    rabbitMQ: {
      subscribeToFanout: (name, callback, subscribedCallback) => {
        rabbitMQSubscribers[name] = {
          name,
          callback,
          subscribedCallback
        };
        if (subscribedCallback && typeof subscribedCallback === 'function')
          subscribedCallback();
      },
      get subscribers() {
        return rabbitMQSubscribers;
      }
    },
    digitalAsset: {
      getAsset: txId => {
        for (var key in assets) {
          if (assets[key].id === txId)
            return assets[key];
        }
        return;
      },
      createAsset: (ownerKeyPair, txData, amount, txMetadata, isSigned, user, assetType, assetFormat, txMethod) => {
        createdDigitalAssets.push({
          ownerKeyPair,
          txData,
          amount,
          txMetadata,
          isSigned,
          user,
          assetType,
          assetFormat,
          txMethod
        });
      },
      get created() {
        return createdDigitalAssets;
      },
      reset() {
        createdDigitalAssets = [];
      }
    },
    'ng-rt-abci-server-rabbitmq-publisherService': {
      addDeliverTxPublisher: (type, name, assetType, includeTx) => {
        rabbitMQPublishers[type] = {
          [name]: {
            assetType,
            includeTx
          }
        };
      },
      types: {
        fanout: 'fanout'
      },
      get publishers() {
        return rabbitMQPublishers
      }
    },
    i18n: {
      __: message => message
    }
  };

  return {
    get: name => services[name]
  }
};

const configurationManager = () => {
  let _pluginConfigs = [{
    name: 'TEST_PLUGIN',
    config: configServiceFactory({}, 'TEST_PLUGING')
  }]

  return {
    get: name => {
      let config = _pluginConfigs.find(p => p.name === name);
      if (config)
        return config.config;
      return;
    },
    get pluginConfigs() {
      return _pluginConfigs;
    }
  };
};

describe('config feed', () => {
  let feed;
  let rabbitMQ;
  let rabbitMQPublishers;
  let configService;
  let daService;
  let services = servicesFactory();
  let pluginConfigurationManager = configurationManager();
  before(() => {
    feed = require('../../../../server/backend/configFeed')(services, pluginConfigurationManager);
    rabbitMQ = services.get('rabbitMQ');
    rabbitMQPublishers = services.get('ng-rt-abci-server-rabbitmq-publisherService');
    configService = services.get('configService');
    daService = services.get('digitalAsset');
  });

  it('should create rabbitMQ fanout publisher', () => {
    assert.property(rabbitMQPublishers.publishers, 'fanout');
    assert.property(rabbitMQPublishers.publishers.fanout, 'config_feed');
    assert.property(rabbitMQPublishers.publishers.fanout['config_feed'], 'assetType');
    assert.equal(rabbitMQPublishers.publishers.fanout['config_feed'].assetType, 'config_feed');
    assert.property(rabbitMQPublishers.publishers.fanout['config_feed'], 'includeTx');
    assert.equal(rabbitMQPublishers.publishers.fanout['config_feed'].includeTx, false);
  });

  it('should subcribe to rabbitMQ', () => {
    assert.property(rabbitMQ.subscribers, 'config_feed');
  });

  describe('onadd', () => {
    before(() => {
      rabbitMQ.subscribers.config_feed.callback(getMessage('onadd'))
    });

    it('should add', () => {
      let added = configService.added[0];
      assert.exists(added);
      assert.property(added, 'name');
      assert.equal(added.name, assets.onadd.data.field);
      assert.property(added, 'value');
      assert.equal(added.value, assets.onadd.data.value);
    });

    after(() => {
      configService.reset();
    });
  });

  describe('onaddmultiple', () => {
    before(() => {
      rabbitMQ.subscribers.config_feed.callback(getMessage('onaddmultiple'));
    });

    it('should add multiple', () => {
      let added = configService.addedMultiple[0];
      assert.exists(added);
      for (var key in assets.onaddmultiple.data.conf) {
        if (assets.onaddmultiple.data.conf.hasOwnProperty(key)) {
          assert.property(added, key);
          assert.equal(added[key], assets.onaddmultiple.data.conf[key]);
        }
      }
    });

    after(() => {
      configService.reset();
    });
  });

  describe('plugin config', () => {
    let pluginConfig;
    before(() => {
      pluginConfig = pluginConfigurationManager.get('TEST_PLUGIN');
      rabbitMQ.subscribers.config_feed.callback(getMessage('onaddplugin'));
    });

    it('should set', () => {
      let added = pluginConfig.added[0];
      assert.exists(added);
      assert.property(added, 'name');
      assert.equal(added.name, assets.onaddplugin.data.field);
      assert.property(added, 'value');
      assert.equal(added.value, assets.onaddplugin.data.value);
    });

    after(() => {
      pluginConfig.reset();
    });
  });

  describe('create digital assets', () => {
    describe('add', () => {
      before(() => {
        configService.onAddCalbacks[0]({
          field: assets.onadd.data.field,
          value: assets.onadd.data.value,
          plugin: '-'
        });
      });

      it('should create asset', () => {
        let asset = daService.created[0];
        assert.exists(asset);
        assert.property(asset, 'txData');
        let data = asset.txData;
        assert.property(data, 'type');
        assert.equal(data.type, 'config_feed');
        assert.property(data, 'operation');
        assert.equal(data.operation, 'add');
        assert.property(data, 'field');
        assert.equal(data.field, assets.onadd.data.field);
        assert.property(data, 'value');
        assert.equal(data.value, assets.onadd.data.value);
      });

      after(() => {
        daService.reset();
      })
    });

    describe('addmultiple', () => {
      before(() => {
        configService.onAddMulttipleCallbacks[0]({
          fields: assets.onaddmultiple.data.conf,
          plugin: '-'
        });
      });

      it('should create asset', () => {
        let asset = daService.created[0];
        assert.exists(asset);
        assert.property(asset, 'txData');
        let data = asset.txData;
        assert.property(data, 'type');
        assert.equal(data.type, 'config_feed');
        assert.property(data, 'operation');
        assert.equal(data.operation, 'addmultiple');
        assert.property(data, 'conf');
        for (var key in assets.onaddmultiple.data.conf) {
          if (assets.onaddmultiple.data.conf.hasOwnProperty(key)) {
            assert.property(data.conf, key);
            assert.equal(data.conf[key], assets.onaddmultiple.data.conf[key]);
          }
        }

      });

      after(() => {
        daService.reset();
      })
    });


  });




});