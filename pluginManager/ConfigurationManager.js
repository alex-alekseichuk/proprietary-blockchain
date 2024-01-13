"use strict";
const PluginConfig = require("./PluginConfig");
const PluginDataManager = require("./PluginDataManager");
const Plugin = require("./Plugin");

class ConfigurationManager {
  constructor(initPlugins, dataPath, getStorageByName, repo, services) {
    var self = this;
    this._repo = repo;
    this.configs = {};
    this.datas = {};
    this.plugins = {};
    this._dataPath = dataPath;
    this._getStorageByName = getStorageByName;
    this._services = services;
    initPlugins.forEach(plugin => {
      self.configs[plugin] = new PluginConfig(plugin);
      self.data[plugin] = new PluginDataManager(self._dataPath, plugin);
      let storage = self._getStorageByName(plugin);
      self.plugins[plugin] = new Plugin(plugin, self.configs[plugin], self.data[plugin], storage, this._repo, this._services);
    });
  }

  async initDb(i18n, app) {
    this._i18n = i18n;
    this._app = app;
    for (const config in this.configs) {
      if (this.configs.hasOwnProperty(config))
        await this.configs[config].initDb(i18n, app);
    }
  }

  async add(plugin) {
    this.configs[plugin] = new PluginConfig(plugin);
    await this.configs[plugin].initDb(this._i18n, this._app);
  }

  remove(plugin) {
    if (this.configs[plugin]) {
      this.configs[plugin].remove();
      delete this.configs[plugin];
    }
  }

  get(plugin) {
    return this.configs[plugin];
  }

  async getWithAdd(plugin) {
    if (!this.configs[plugin]) {
      await this.add(plugin);
      this.plugins[plugin] = new Plugin(plugin, this.get(plugin), this.data(plugin), this._getStorageByName(plugin), this._repo, this._services);
    }
    return this.configs[plugin];
  }

  data(plugin) {
    if (!this.datas[plugin])
      this.datas[plugin] = new PluginDataManager(this._dataPath, plugin);
    return this.datas[plugin];
  }

  plugin(plugin) {
    if (!this.plugins[plugin])
      this.plugins[plugin] = new Plugin(plugin, this.get(plugin), this.data(plugin), this._getStorageByName(plugin), this._repo, this._services);
    return this.plugins[plugin];
  }

  get pluginConfigs() {
    return Object.keys(this.configs).map(k => {
      return {plugin: k, config: this.configs[k]};
    });
  }
}

module.exports = ConfigurationManager;
