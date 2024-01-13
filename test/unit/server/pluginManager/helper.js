'use strict';
const path = require('path');
const Router = require('./manager/Router');
const getServices = require('./services');
const configService = require('./configService');

class Model {
  constructor(name) {
    this._name = name;
    this._list = [];
  }

  get name() {
    return this._name;
  }

  get list() {
    return this._list;
  }

  create(record) {
    this._list.push(record);
    return Promise.resolve();
  }

  destroyAll() {
    this._list = [];
    return Promise.resolve();
  }

  updateAll() {
    return Promise.resolve();
  }
}

module.exports = (config, modelNames, pluginConfig) => {
  let models = {};
  let modelsContainer = {};
  let router = new Router();
  modelNames.forEach(modelName => {
    modelsContainer[modelName] = [];
    models[modelName] = new Model(modelName);
  });

  let services = getServices({ config: config });

  return {
    server: {
      models: models,
      get: (...args) => {
        router.addGet.apply(router, args);
      },
      post: (...args) => {
        router.addPost.apply(router, args);
      },
      testRouter: router,
      ensureLoggedIn: () => {
      },
      ensureUserRoles: () => {},
      ensureApplicationByRoles: () => {}
    },
    pluginInstance: {
      path: {
        absolute: "./test/unit/server/pluginManager"
      },
      config: configService(pluginConfig),
      storage: {
        require: (plugin, filePath) => {
          if (!filePath)
            filePath = plugin;
          filePath = path.resolve("./test/unit/server/pluginManager", filePath);
          delete require[filePath];
          return require(filePath);
        }
      }
    },
    services: services
  };
};
