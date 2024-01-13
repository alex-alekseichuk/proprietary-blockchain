"use strict";

const fs = require("fs-extra");
const Path = require("./Path");

class PluginDataManager {
  constructor(dataFolder, plugin) {
    this._dataFolder = dataFolder;
    this._plugin = plugin;
    fs.mkdirsSync(this.path.absolute);
  }

  get path() {
    return new Path(this._dataFolder, this._plugin);
  }
}

module.exports = PluginDataManager;
