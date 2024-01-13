'use strict';
const path = require('path');

class PluginSmokeTest {
  constructor(pluginInstance, options, services) {
    let self = this;
    this._pluginInstance = pluginInstance;
    this._runOnActivate = options.runActivate;
    this._services = services;
    this._options = options;
    if (options.interval) {
      this._interval = options.interval;
      setInterval(() => {
        self.execute();
      }, this.interval);
    }
    this._file = path.resolve(this._pluginInstance.path.absolute, options.file);
  }

  execute(container) {
    return new Promise((resolve, reject) => {
      let test = this._pluginInstance.storage.require(this._pluginInstance.name, this._file);
      if (typeof test === 'function') {
        return test(this._pluginInstance, this._options.testOptions, this._services).then(() => resolve(container)).catch(err => {
          container.push(err);
          resolve(container);
        });
      }
      resolve(container);
    });
  }

  get plugin() {
    return this._pluginInstance;
  }

  get runOnActivate() {
    return this._runOnActivate;
  }

  get interval() {
    return this._interval;
  }
}

module.exports = PluginSmokeTest;
