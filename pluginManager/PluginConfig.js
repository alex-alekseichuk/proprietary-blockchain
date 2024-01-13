'use strict';
const fs = require("fs");
const path = require("path");
const nconf = require("nconf");
const logger = require('log4js').getLogger('pluginManager/configService.js');
const crypto = require("crypto");
const CONFIG_DIR = path.resolve(__dirname, '..', "config", "plugins");
const LoopbackConfigService = require('../server/backend/LoopbackConfigService');

class PluginConfig {
  constructor(plugin) {
    this._plugin = plugin;
    this._nconfStore = this._store = new nconf.Provider();
    this.fileName = this._plugin + ".json";
    try {
      fs.lstatSync(CONFIG_DIR);
    } catch (e) {
      fs.mkdirSync(CONFIG_DIR);
    }
    this.configFile = path.resolve(CONFIG_DIR, this.fileName);

    try {
      fs.accessSync(this.configFile);
    } catch (e) {
      fs.writeFileSync(this.configFile, "{}");
    }

    try {
      this._store.file(plugin, {
        file: this.configFile
      });
    } catch (e) {
      logger.error('Error get', plugin, 'plugin config file!');
    }
  }

  async initDb(i18n, app) {
    this._dbStore = new LoopbackConfigService(i18n, this._nconfStore, app, this._plugin);
    await this._dbStore.init();
    this._store = {
      get: key => {
        return this._dbStore.get(key);
      },
      set: (key, value, hidden) => {
        return this._dbStore.add(key, value, hidden);
      },
      save: callback => {
        if (callback && typeof callback === 'function')
          callback();
      },
      onadd: callback => {
        this._dbStore.onadd(callback);
      },
      onaddmultiple: callback => {
        this._dbStore.onaddmultiple(callback);
      },
      load: () => {

      },
      remove: () => {
        this._dbStore.clear();
      }
    };
  }

  get(key) {
    return this._store.get(key);
  }

  async set(key, value, hidden) {
    return this._store.set(key, value, hidden);
  }

  save(cb) {
    return this._store.save(cb);
  }

  get name() {
    return this._plugin;
  }

  onadd(callback) {
    this._store.onadd(callback);
  }

  onaddmultiple(callback) {
    this._store.onaddmultiple(callback);
  }

  async remove() {
    var self = this;
    fs.unlink(self.configFile, err => {
      if (err) return logger.debug("error on unlink", self.configFile, err);
      logger.debug(self.configFile, "removed!");
    });
    if (this._dbStore)
      this._dbStore.clear();
  }

  reload() {
    this._store.load();
  }

  get hash() {
    let configObject = this.get();
    if (configObject._hash) {
      delete configObject._hash;
    }
    configObject = JSON.stringify(configObject);
    let configHash = crypto.createHash("md5").update(configObject).digest("hex");
    logger.debug("debug hash", configHash, "from", configObject);
    return configHash;
  }

}

module.exports = PluginConfig;
