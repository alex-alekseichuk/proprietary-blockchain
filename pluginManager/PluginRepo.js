'use strict';

class PluginRepo {
  constructor(applicationRepo, name) {
    this._name = name;
    this._repo = applicationRepo;
  }

  getInstance() {
    return this._repo.findOne(this._name);
  }

  setActivation(unactivated) {
    return this._repo.setActivation(this._name, unactivated);
  }

  remove(plugin) {
    return this._repo.remove(this._name.repo);
  }

  setLicenseState(state) {
    return this._repo.setLicenseState(this._name, state);
  }

  setActivated(activated) {
    return this._repo.setActivated(this._name, activated);
  }

  clearMessages(property) {
    return this._repo.clearMessages(this._name, property);
  }

  clearActivateMessages() {
    return this._repo.messages.activate.clear(this._name);
  }

  clearDeacticvateMessages() {
    return this._repo.messages.deactivate.clear(this._name);
  }

  clearInstallMessages() {
    return this._repo.messages.install.clear(this._name);
  }

  clearUninstallMessages() {
    return this._repo.messages.uninstall.clear(this._name);
  }

  clearSmokeTestMessages() {
    return this._repo.messages.smoke.clear(this._name);
  }

  addActivateMessage(message) {
    return this._repo.messages.activate.add(this._name, message);
  }

  addDeactivateMessage(message) {
    return this._repo.messages.deactivate.add(this._name, message);
  }

  addInstallMessage(message) {
    return this._repo.messages.install.add(this._name, message);
  }

  addUninstallMessage(message) {
    return this._repo.messages.uninstall.add(this._name, message);
  }

  addSmokeTestMessage(message) {
    return this._repo.messages.smoke.add(this._name, message);
  }

  setAsApp(asApp) {
    return this._repo.setAsApp(this._name, asApp);
  }

  setAsSubscription(asSubscription) {
    return this._repo.setAsSubscription(this._name, asSubscription);
  }
}

module.exports = PluginRepo;
