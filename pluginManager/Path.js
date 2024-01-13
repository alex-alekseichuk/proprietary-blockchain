"use strict";
const path = require("path");

class Path {
  constructor(dataFolder, plugin) {
    this._folder = dataFolder;
    this._plugin = plugin;
  }

  get absolute() {
    return path.resolve(this._folder, this._plugin);
  }

  get relative() {
    return this._folder + "/" + this._plugin;
  }
}

module.exports = Path;
