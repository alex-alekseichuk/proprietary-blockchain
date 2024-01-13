"use strict";

class FilePluginStorage {
  constructor(id, title, services, parameters, i18n, lockUpdate) {
    this._id = id;
    this._downloaded = [];
    this._unpacked = [];
    this._s3downloaded = [];
    this._removedPlugins = [];
  }

  downloads3(bucket, key) {
    return new Promise((resolve, reject) => {
      this._s3downloaded.push({ bucket: bucket, key: key });
      let filePath = key.split('/');
      if (filePath.length > 0)
        filePath = filePath[filePath.length - 1];
      else
        filePath = key;
      resolve(`test/unit/server/pluginManager/data/${filePath}`);
    });
  }

  unpack(filePath, source, name) {
    return new Promise((resolve, reject) => {
      this._unpacked.push({ filePath: filePath, source: source, name: name });
      resolve(this);
    });
  }

  existsFolder(name) {
    return true;
  }

  getS3(bucket, key) {
    return new Promise((resolve, reject) => {
      this._s3downloaded.push({ bucket: bucket, key: key });
      resolve(this);
    });
  }

  get downloaded() {
    return this._downloaded;
  }

  get unpacked() {
    return this._unpacked;
  }

  get s3downloaded() {
    return this._s3downloaded;
  }

  get removedPlugins() {
    return this._removedPlugins;
  }

  removePluginDir(name) {
    this._removedPlugins.push(name);
  }

}

module.exports = FilePluginStorage;
