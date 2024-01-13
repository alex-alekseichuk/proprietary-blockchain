'use strict';

const pluginsFeed = require('../../../../pluginManager/pluginsFeed');

const sinonChai = require("sinon-chai");
const chai = require('chai');
chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;
const assert = chai.assert;
let feed;
const initConfig = {
  pluginsFeed: {
    subscribe: true,
    update: {
      enabled: true
    },
    activated: {
      enabled: true
    },
    deactivated: {
      enabled: true
    },
    installed: {
      enabled: true
    },
    uninstalled: {
      enabled: true
    },
    publish: {
      enabled: true,
      chunkSize: 4
    }
  }
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


const getServices = () => {
  let rabbitMQSubscribers = {};
  let rabbitMQPublishers = {};
  let CONFIG = { ...initConfig };
  let createdDigitalAssets = [];
  const servicesFactory = {
    configService: {
      get: name => {
        let fields = getDeepObjectField(name);
        if (!fields)
          return CONFIG[name];
        let rootField = fields.shift();
        return getDeepObjectFieldValue(fields, CONFIG[rootField]);
      },
      set: (name, value) => CONFIG[name] = value,
      reset: () => {
        CONFIG = { ...initConfig };
      }
    },
    rabbitMQ: {
      subscribeToFanout: (name, callback, subscribedCallback) => {
        rabbitMQSubscribers[name] = {
          name,
          callback,
          subscribedCallback
        };
        subscribedCallback();
      },
      subscribers: rabbitMQSubscribers
    },
    digitalAsset: {
      getAsset: txId => {
        let asset;
        for (var key in assets) {
          if (assets[key].id === txId)
            return assets[key];
        }
        return;
      },
      findAssetByProperty: (property, propertyValue, assetType) => {
        let founded = [];
        for (var key in assets) {
          let asset = assets[key];
          if (asset.metadata && asset.data.type === assetType) {
            if (asset.metadata[property] === propertyValue)
              founded.push(asset);
          }
        }
        return founded;
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
      publishers: rabbitMQPublishers
    },
    i18n: {
      __: message => message
    }
  };
  return {
    get: name => servicesFactory[name]
  }
}

const assets = {
  update: {
    id: '0',
    data: {
      type: 'plugin_feed',
      producerId: 1,
      operation: 'PLUGIN_UPDATED',
      pluginName: 'TEST_PLUGIN'
    }
  },
  activated: {
    id: '01',
    data: {
      type: 'plugin_feed',
      producerId: 1,
      operation: 'PLUGIN_ACTIVATED',
      pluginName: 'TEST_PLUGIN'
    }
  },
  deactivated: {
    id: '02',
    data: {
      type: 'plugin_feed',
      producerId: 1,
      operation: 'PLUGIN_DEACTIVATED',
      pluginName: 'TEST_PLUGIN'
    }
  },
  installed: {
    id: '03',
    data: {
      type: 'plugin_feed',
      producerId: 1,
      operation: 'PLUGIN_INSTALLED',
      pluginName: 'TEST_PLUGIN'
    }
  },
  uninstalled: {
    id: '04',
    data: {
      type: 'plugin_feed',
      producerId: 1,
      operation: 'PLUGIN_UNINSTALLED',
      pluginName: 'TEST_PLUGIN'
    }
  },
  publish1: {
    id: '1',
    data: {
      type: 'plugin_feed',
      producerId: 1,
      operation: 'publish',
      pluginName: 'TEST_PLUGIN',
      chunkIndex: 0,
      chunkCount: 2,
      buffer: {
        data: [0, 1]
      },
      publishPluginId: '1',
      version: '3.0.2'
    },
    metadata: {
      publishPluginId: '1'
    }
  },
  publish2: {
    id: '2',
    data: {
      type: 'plugin_feed',
      producerId: 1,
      operation: 'publish',
      pluginName: 'TEST_PLUGIN',
      chunkIndex: 1,
      chunkCount: 2,
      buffer: {
        data: [2, 3]
      },
      publishPluginId: '1',
      version: '3.0.2'
    },
    metadata: {
      publishPluginId: '1'
    }
  }
}

const digitalAssetMessages = {
  update: {
    message: {
      txId: assets.update.id
    }
  },
  activated: {
    message: {
      txId: assets.activated.id
    }
  },
  deactivated: {
    message: {
      txId: assets.deactivated.id
    }
  },
  installed: {
    message: {
      txId: assets.installed.id
    }
  },
  uninstalled: {
    message: {
      txId: assets.uninstalled.id
    }
  },
  publish: {
    message: {
      txId: '1'
    }
  }
};

const pluginManifests = {
  'TEST_PLUGIN': {
    'version': '3.0.'
  }
}

const pluginManager = () => {
  let hasUpdatesResult = { has: true };
  let pluginUpdated = false;
  let _addedPlugin = {};
  let _installedPlugins = {};
  let _activatedPlugins = {};
  let downloadedZip = {};
  let storage = {
    getManifest: pluginName => pluginManifests[pluginName],
    version: (pluginName) => '1',
    savePluginZip: (pluginName, buf) => {
      downloadedZip[pluginName] = buf;
    },
    unpack: (filePath, source, name) => {
      _addedPlugin[name] = true;
    },
    publish: pluginName => {
      return [0, 1, 2, 3];
    }
  };
  return {
    getStorage: () => storage,
    install: pluginName => { _installedPlugins[pluginName] = true },
    uninstall: pluginName => { delete _installedPlugins[pluginName] },
    deactivate: pluginName => { delete _activatedPlugins[pluginName] },
    activate: pluginName => { _activatedPlugins[pluginName] = true; },
    remove: pluginName => { _addedPlugin[pluginName] },
    updatePlugin: pluginName => {
      if (pluginName === 'TEST_PLUGIN')
        pluginUpdated = true;
    },
    appRepo: {
      findOne: pluginName => {
        return {
          active: true
        };
      }
    },
    compareVersions: () => true,
    hasUpdates: () => Promise.resolve(hasUpdatesResult),
    hasUpdatesResult,
    pluginUpdated: () => pluginUpdated,
    reset: () => {
      hasUpdatesResult = { has: true };
      pluginUpdated = false;
      _activatedPlugins = {};
      _installedPlugins = {};
      
    },
    getPlugin: () => {
      return {
        active: true
      }
    },
    get downloaded() {
      return downloadedZip;
    },
    get addedPlugin() {
      return _addedPlugin;
    },
    get installed() {
      return _installedPlugins;
    },
    get activated() {
      return _activatedPlugins;
    }
  };
};

describe('plugins feed', () => {
  let services;
  let rabbitMQ;
  let rabbitMQPublishers;
  let configService;
  let manager = pluginManager();
  let daService;
  before(() => {
    services = getServices();
    feed = pluginsFeed(services, manager);
    rabbitMQ = services.get('rabbitMQ');
    rabbitMQPublishers = services.get('ng-rt-abci-server-rabbitmq-publisherService');
    configService = services.get('configService');
    daService = services.get('digitalAsset');
  });

  describe('subscribe', () => {
    it('should not subscribe as config subscribe false', async () => {
      configService.set('pluginsFeed', { subscribe: false });
      let result = await feed.subscribe();
      assert.equal(result, false);
      configService.reset();
    });

    it('should subscribe to rabbitmq queue', async () => {
      let result = await feed.subscribe();
      assert.property(rabbitMQ.subscribers, 'plugin_feed');
    });

    it('should add rabbitmq deliiver tx publisher', () => {
      assert.property(rabbitMQPublishers.publishers, 'fanout');
      assert.property(rabbitMQPublishers.publishers.fanout, 'plugin_feed');
      assert.property(rabbitMQPublishers.publishers.fanout.plugin_feed, 'assetType');
      assert.equal(rabbitMQPublishers.publishers.fanout.plugin_feed.assetType, 'plugin_feed');
      assert.equal(rabbitMQPublishers.publishers.fanout.plugin_feed.includeTx, false);
    });

    describe('plugin update', () => {
      before(() => {
        rabbitMQ.subscribers.plugin_feed.callback(digitalAssetMessages.update);
      });

      it('should update plugin', () => {
        assert.equal(manager.pluginUpdated(), true);
      });

      describe('config', () => {
        before(() => {
          manager.reset();
          configService.set('pluginsFeed', { subscribe: true, update: { enabled: false } });
          rabbitMQ.subscribers.plugin_feed.callback(digitalAssetMessages.update);
        });

        it('should not update if disabled in config', () => {
          assert.equal(manager.pluginUpdated(), false);
        });

        after(() => {
          configService.reset();
          manager.reset();
        });
      });
    });

    describe('plugin activate', () => {
      before(() => {
        rabbitMQ.subscribers.plugin_feed.callback(digitalAssetMessages.activated);
      });
      it('should activate plugin', () => {
        assert.property(manager.activated, "TEST_PLUGIN");
        assert.equal(manager.activated.TEST_PLUGIN, true);
      });
      //after(() => manager.reset() );
      describe('plugin deactivate', () => {
        before(() => {
          rabbitMQ.subscribers.plugin_feed.callback(digitalAssetMessages.deactivated);
        });

        it('should deactivate plugin', () => {
          assert.notProperty(manager.activated, "TEST_PLUGIN");
        });

        after(() => {
          manager.reset();
        });
      });
    });

    describe('plugin install', () => {
      before(() => {
        rabbitMQ.subscribers.plugin_feed.callback(digitalAssetMessages.installed);
      });
      it('should install plugin', () => {
        assert.property(manager.installed, "TEST_PLUGIN");
        assert.equal(manager.installed.TEST_PLUGIN, true);
      });
      //after(() => manager.reset() );
      describe('plugin uninstall', () => {
        before(() => {
          rabbitMQ.subscribers.plugin_feed.callback(digitalAssetMessages.uninstalled);
        });

        it('should uninstall plugin', () => {
          assert.notProperty(manager.installed, "TEST_PLUGIN");
        });

        after(() => {
          manager.reset();
        });
      });
    });


    describe('publish plugin', () => {
      before(() => {
        rabbitMQ.subscribers.plugin_feed.callback(digitalAssetMessages.publish);
      });

      it('archive downloaded', () => {
        assert.property(manager.downloaded, 'TEST_PLUGIN');
      });

      it('chunks added to buffer', () => {
        assert.deepEqual(
          manager.downloaded['TEST_PLUGIN'],
          [...assets.publish1.data.buffer.data,
          ...assets.publish2.data.buffer.data]
        );
      });

      it('archive unpacked', () => {
        assert.property(manager.addedPlugin, 'TEST_PLUGIN');
        assert.equal(manager.addedPlugin["TEST_PLUGIN"], true);
      });

      it('installed', () => {
        assert.property(manager.installed, 'TEST_PLUGIN');
        assert.equal(manager.installed["TEST_PLUGIN"], true);
      });

      it('activated', () => {
        assert.property(manager.activated, 'TEST_PLUGIN');
        assert.equal(manager.activated["TEST_PLUGIN"], true);
      });

      after(() => {
        configService.reset();
        manager.reset();
      });

    });
  });

  describe('publish plugin update', () => {
    before(() => {
      feed.publishPluginOperation('TEST_PLUGIN', manager.getStorage(), feed.MESSAGES.UPDATED);
    });
    it('should create dgital asset', () => {
      let asset = daService.created[0];
      assert.exists(asset);
      assert.property(asset, 'assetType');
      assert.equal(asset.assetType, 'plugin_feed');
      assert.property(asset, 'txData');
      assert.property(asset.txData, 'type');
      assert.equal(asset.txData.type, 'plugin_feed');
      assert.property(asset.txData, 'operation');
      assert.equal(asset.txData.operation, feed.MESSAGES.UPDATED);
      assert.property(asset.txData, 'pluginName');
      assert.equal(asset.txData.pluginName, 'TEST_PLUGIN');
      assert.property(asset.txData, 'producerId');
      assert.equal(asset.txData.producerId, feed.uniqueId);
      assert.property(asset.txData, 'version');
    });
    after(() => {
      daService.reset();
    });
  });

  describe('publish plugin', () => {
    let asset1;
    let asset2;
    before(async () => {
      await feed.publishPlugin('TEST_PLUGIN', manager.getStorage());
      asset1 = daService.created[0];
      asset2 = daService.created[1];
    });
    it('should create digital asset', () => {
      assert.isNotNull(asset1);
      assert.property(asset1, 'assetType');
      assert.equal(asset1.assetType, 'plugin_feed');
      assert.property(asset1, 'txData');
      assert.property(asset1.txData, 'type');
      assert.equal(asset1.txData.type, 'plugin_feed');
      assert.property(asset1.txData, 'operation');
      assert.equal(asset1.txData.operation, 'publish');
      assert.property(asset1.txData, 'pluginName');
      assert.equal(asset1.txData.pluginName, 'TEST_PLUGIN');
      assert.property(asset1.txData, 'producerId');
      assert.equal(asset1.txData.producerId, feed.uniqueId);
      assert.property(asset1.txData, 'chunkIndex');
      assert.equal(asset1.txData.chunkIndex, 0);
      assert.property(asset1.txData, 'chunkCount');
      assert.equal(asset1.txData.chunkCount, 2);
      assert.property(asset1.txData, 'buffer');
    });
    it('should create second digitalAsset', () => {
      assert.isNotNull(asset2);
      assert.property(asset2, 'assetType');
      assert.equal(asset2.assetType, 'plugin_feed');
      assert.property(asset2, 'txData');
      assert.property(asset2.txData, 'type');
      assert.equal(asset2.txData.type, 'plugin_feed');
      assert.property(asset2.txData, 'operation');
      assert.equal(asset2.txData.operation, 'publish');
      assert.property(asset2.txData, 'pluginName');
      assert.equal(asset2.txData.pluginName, 'TEST_PLUGIN');
      assert.property(asset2.txData, 'producerId');
      assert.equal(asset2.txData.producerId, feed.uniqueId);
      assert.property(asset2.txData, 'chunkIndex');
      assert.equal(asset2.txData.chunkIndex, 1);
      assert.property(asset2.txData, 'chunkCount');
      assert.equal(asset2.txData.chunkCount, 2);
      assert.property(asset2.txData, 'buffer');
    });

    it('buffer', () => {
      assert.deepEqual([...asset1.txData.buffer, ...asset2.txData.buffer], [0,1,2,3]);
    });
    

    after(() => {
      daService.reset();
    });

  });


});