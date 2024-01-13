"use strict";
const events = require('events');
const logger = require('log4js').getLogger('services.plugins');
const wget = require('wget-improved');
const osTmpdir = require('os-tmpdir');
const metricsClient = require("./metricsClient");

var eventEmitter = new events.EventEmitter();

module.exports = function(pluginsManager) {
  logger.debug('Executing plugins.js now ');

  this.connect = function() {
    return eventEmitter;
  };

  this.downloadPack = function(zipUrl) {
    return new Promise(function(resolve, reject) {
      var fileName = zipUrl.split("/");
      fileName = fileName[fileName.length - 1];

      var src = zipUrl;
      var filepath = osTmpdir() + "/" + fileName;

      logger.debug(">> -- >> tmp filepath:", filepath);

      var download = wget.download(src, filepath, {});
      download.on('error', function(err) {
        reject(err);
      });
      download.on('start', function(fileSize) {
        logger.debug(fileSize);
      });
      download.on('end', function(output) {
        metricsClient.increment('Download_Plugin');
        eventEmitter.emit("status", "download finish:" + output);
        pluginsManager.add_from_archive(filepath).then(pluginName => {
          metricsClient.increment('Download_' + pluginName);
          eventEmitter.emit("status", "plugins manager result:" + pluginName);
          return resolve(pluginName);
        });
      });

      download.on('progress', function(progress) {
        eventEmitter.emit("status", "download:" + progress);
      });
    });
  };

  this.getPluginsList = function() {
    return pluginsManager.get_plugins();
  };

  this.install = function(name, eventEmitter) {
    return pluginsManager.install(name, eventEmitter);
  };

  this.unTar = function(path) {
  };
};
