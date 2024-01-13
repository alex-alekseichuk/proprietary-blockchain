"use strict";
const logger = require('log4js').getLogger('Plugin.js');
const Path = require("./Path");
const PluginRepo = require('./PluginRepo');
const PluginSmokeTest = require('./PluginSmokeTest');

class Plugin {
  constructor(name, config, data, storage, repo, services) {
    var self = this;
    this._name = name;
    this._config = config;
    this._data = data;
    this._storage = storage;
    if (this._storage) {
      this._path = new Path(this._storage.folder, this._name);
      this._repo = new PluginRepo(repo, name);
      this._tests = [];
      this._storage.getManifest(name).then(manifest => {
        if (manifest.smokeTests) {
          manifest.smokeTests.forEach(opts => {
            let test = new PluginSmokeTest(self, opts, services);
            self._tests.push(test);
          });
        }
      });
    }
    this._i18n = services.get('i18n');
  }

  get name() {
    return this._name;
  }

  get config() {
    return this._config;
  }

  get data() {
    return this._data;
  }

  get storage() {
    return this._storage;
  }

  get path() {
    return this._path;
  }

  get repo() {
    return this._repo;
  }

  executeTests() {
    return new Promise((resolve, reject) => {
      this._repo.clearSmokeTestMessages();
      if (!this._tests || this._tests.length === 0)
        return resolve();
      let container = [];
      return Promise.all(this._tests.map(t => t.execute(container))).then(() => {
        logger.info(`${this._i18n.__('Plugin')} ${this._name} ${this._i18n.__('smoke test result')}:`);
        if (container && container.length > 0) {
          container.forEach(c => {
            logger.info(this._i18n.__('error') + ': ' + c);
          });
        } else {
          logger.info(this._i18n.__('All test\'s passed'));
        }
        resolve(container);
      }).catch(err => {
        logger.error(err);
        reject(err);
      });
    });
  }
}

module.exports = Plugin;