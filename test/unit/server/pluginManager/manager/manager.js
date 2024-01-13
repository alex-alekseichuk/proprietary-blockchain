'use strict';
const EventEmitter = require('events').EventEmitter;

const getClass = (activated, installed, added) => {

  class PluginManager {
    constructor(app, configService, services) {
      this._app = app;
      this._configService = configService;
      this._services = services;
      this._events = new EventEmitter();
      this._activated = activated || [];
      this._installed = installed || [];
      this._added = added || [];
      this._addedByConfig = [];
      this._locked = false;
    }

    get_plugins() {
      return Promise.resolve(this._added.map(n => {
        let application = this._installed.indexOf(n) > -1 ? { name: n, activated: this._activated.indexOf(n) > -1 } : null;
        return { name: n, application: application };
      }));
    }

    exists(name) {
      return this._added.indexOf(name) > -1;
    }

    install(name) {
      this._installed.push(name);
      return Promise.resolve();
    }

    activate(name) {
      this._activated.push(name);
      return Promise.resolve();
    }

    uninstall(name) {
      this._installed = this._installed.filter(n => n != name);
      return Promise.resolve();
    }

    deactivate(name) {
      this._activated = this._activated.filter(n => n != name);
      return Promise.resolve();
    }

    remove(name) {
      this._added = this._added.filter(n => n != name);
      this._addedByConfig = this._addedByConfig.filter(n => n != name);
      return Promise.resolve();
    }

    isInstalled(name) {
      return Promise.resolve(this._installed.indexOf(name) > -1);
    }

    add_by_config(config) {
      this._addedByConfig.push(config);
      this._added.push(config.name);
      return Promise.resolve();
    }

    clear_plugin() {
      return Promise.resolve();
    }

    get events() {
      return this._events;
    }

    unlock() {
      return Promise.resolve();
    }

    subscribeToUpdates() {
      return Promise.resolve();
    }

    get installed() {
      return this._installed;
    }

    get activated() {
      return this._activated;
    }

    get added() {
      return this._added;
    }

    checkLock() {
      return Promise.resolve(this._locked);
    }

    lock(lock) {
      this._locked = lock;
      return Promise.resolve();
    }

    get_manifest(name) {
      return Promise.resolve({
        name: name,
        settings: {}
      })
    }
  }

  return PluginManager;
};
module.exports = getClass;
