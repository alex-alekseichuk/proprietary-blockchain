'use strict';
const logger = require('log4js').getLogger('ng-rt-node-red.storage');
// Connection URL
const fs = require('fs-extra');
const fspath = require("path");
const mkdirp = fs.mkdirs;
const util = require('util');
var promiseDir = util.promisify(mkdirp);

var initialFlowLoadComplete = false;
var settings;
var libDir;
var libFlowsDir;

module.exports = (app, i18n, events) => {
  /**
   *
   * @param {object} root - root directory as parameter
   * @param {object} path - path address as parameter
   * @return {meta} meta value on command finish
   */
  function getFileMeta(root, path) {
    var fn = fspath.join(root, path);
    var fd = fs.openSync(fn, "r");
    var size = fs.fstatSync(fd).size;
    var meta = {};
    var read = 0;
    var length = 10;
    var remaining = "";
    var buffer = new Buffer(length);
    while (read < size) {
      read += fs.readSync(fd, buffer, 0, length);
      var data = remaining + buffer.toString();
      var parts = data.split("\n");
      remaining = parts.splice(-1);
      for (var i = 0; i < parts.length; i += 1) {
        var match = /^\/\/ (\w+): (.*)/.exec(parts[i]);
        if (match) {
          meta[match[1]] = match[2];
        } else {
          read = size;
          break;
        }
      }
    }
    fs.closeSync(fd);
    return meta;
  }

  /**
   * @param {object} root - root directory as parameter
   * @param {object} path - path address as parameter
   * @return {body} body value on command finish
   */
  function getFileBody(root, path) {
    let body = "";
    let fn = fspath.join(root, path);
    let fd = fs.openSync(fn, "r");
    let size = fs.fstatSync(fd).size;
    let scanning = true;
    let read = 0;
    let length = 50;
    let remaining = "";
    let buffer = new Buffer(length);
    while (read < size) {
      var thisRead = fs.readSync(fd, buffer, 0, length);
      read += thisRead;
      if (scanning) {
        var data = remaining + buffer.slice(0, thisRead).toString();
        var parts = data.split("\n");
        remaining = parts.splice(-1)[0];
        for (var i = 0; i < parts.length; i += 1) {
          if (!/^\/\/ \w+: /.test(parts[i])) {
            scanning = false;
            body += parts[i] + "\n";
          }
        }
        if (!/^\/\/ \w+: /.test(remaining)) {
          scanning = false;
        }
        if (!scanning) {
          body += remaining;
        }
      } else {
        body += buffer.slice(0, thisRead).toString();
      }
    }
    fs.closeSync(fd);
    return body;
  }
  /**
   * @param {object} path - path address as parameter
   * @param {object} content - content value as parameter
   * @return {Promise} on command finish
   */
  function writeFile(path, content) {
    return new Promise((resolve, reject) => {
      var stream = fs.createWriteStream(path);
      stream.on('open', fd => {
        stream.end(content, 'utf8', () => {
          fs.fsync(fd, resolve);
        });
      });
      stream.on('error', err => {
        reject(err);
      });
    });
  }

  const findFlows = callback => {
    // Get the documents collection
    var dbflows = app.models.nodeRedFlow;
    var projects = app.models.nodeRedProject;
    // Find some documents
    dbflows.find((err, result) => {
      if (err) {
        logger.error(err);
        return callback(err);
      }
      let flows = result.map(r => r.flow);
      return projects.find((err, projects) => {
        if (err) {
          return callback(err);
        }
        projects.forEach((e, i, a) => {
          var exist = flows.filter(el => {
            return el.id == e._id.toJSON();
          });
          if (exist.length === 0)
            flows.push({
              id: e._id.toJSON(),
              label: e.description,
              type: "project",
              flows: []
            });
        });
        return callback(null, flows);
      });
    });
  };

  var storage = {
    init: _settings => {
      let promises = [];
      settings = _settings;
      if (!settings.userDir) {
        try {
          fs.statSync(fspath.join(process.env.NODE_RED_HOME, ".config.json"));
          settings.userDir = process.env.NODE_RED_HOME;
        } catch (err) {
          settings.userDir = fspath.join(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE || process.env.NODE_RED_HOME, ".node-red");
          if (!settings.readOnly) {
            promises.push(promiseDir(fspath.join(settings.userDir, "node_modules")));
          }
        }
      }

      libDir = fspath.join(settings.userDir, "lib");
      libFlowsDir = fspath.join(libDir, "flows");

      if (!settings.readOnly) {
        promises.push(promiseDir(libFlowsDir));
      }

      return Promise.all(promises);
    },
    getFlows: () => {
      return new Promise((resolve, reject) => {
        if (!initialFlowLoadComplete) {
          initialFlowLoadComplete = true;
        }
        findFlows((err, flows) => {
          if (err)
            return reject(err);
          return resolve(flows);
        });
      });
    },
    saveFlows: newflows => {
      return new Promise((resolve, reject) => {
        let dbflows = app.models.nodeRedFlow;
        findFlows((err, oldflows) => {
          if (err)
            return reject(err);
          // delete
          if (oldflows)
            oldflows.forEach((e, i, a) => {
              var exist = newflows.filter(el => {
                return e.id === el.id;
              });
              if (exist.length === 0) {
                dbflows.destroyById(e._id, (err, count) => {
                  if (err)
                    return reject(err);
                });
              }
            });
          // insert or update
          newflows.forEach((e, i, a) => {
            dbflows.upsertWithWhere({ flowId: e.id }, {
              flowId: e.id,
              flow: e,
              type: e.type,
              label: e.label,
              z: e.z,
              name: e.name
            }, (err, result) => {
              if (err)
                return reject(err);
            });
          });
          events.emit('NODE_RED_FLOWS_UPDATED');
          return resolve();
          // update code for close db connection
        });
      });
    },

    getCredentials: () => {
      return new Promise((resolve, reject) => {
        var dbCredentials = app.models.nodeRedCredentials;
        dbCredentials.find((err, credentials) => {
          if (err) {
            return reject(err);
          }
          if (credentials.length == 0) {
            return resolve({});
          }
          return resolve(credentials.reduce((obj, act, i) => {
            obj[act.node_id] = act.credentials;
            return obj;
          }, {}));
        });
      });
    },
    saveCredentials: credentials => {
      if (settings.readOnly) {
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        var dbCredentials = app.models.nodeRedCredentials;
        for (var key in credentials) {
          if (credentials.hasOwnProperty(key)) {
            var objCred = {
              node_id: key,
              credentials: credentials[key]
            };
            dbCredentials.upsertWithWhere({ node_id: key }, objCred, (err, result) => {
              if (err)
                return reject(err);
            });
          }
        }
        return resolve();
      });
    },
    getSettings: () => {
      return new Promise((resolve, reject) => {
        var settings = app.models.nodeRedSettings;
        settings.find((err, setting) => {
          if (err)
            reject(err);
          if (setting.length === 0) {
            return resolve({});
          }
          return resolve(setting[0]);
        });
      });
    },
    saveSettings: settings => {
      return new Promise((resolve, reject) => {
        var dbsettings = app.models.nodeRedSettings;
        dbsettings.find((err, setting) => {
          if (err) {
            return logger.debug(err);
          }
          if (setting.length === 0) {
            return dbsettings.create(settings, (err, result) => {
              if (err)
                reject(err);
              resolve(result);
            });
          }
          return dbsettings.upsertWithWhere({ id: setting[0]._id }, settings, (err, result) => {
            if (err)
              return reject(err);
            resolve(result);
          });
        });
      });
    },
    getSessions: () => {
      return new Promise((resolve, reject) => {
        var dbSessions = app.models.nodeRedSessions;
        dbSessions.find((err, sessions) => {
          if (err) {
            return reject(err);
          }
          if (sessions.length == 0)
            return resolve({});

          return resolve(sessions.reduce((obj, act, i) => {
            obj[act.accessToken] = act;
            return obj;
          }, {}));
        });
      });
    },
    saveSessions: sessions => {
      if (settings.readOnly) {
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        var dbSessions = app.models.nodeRedSessions;
        for (var objSession in sessions) {
          if (sessions.hasOwnProperty(objSession))
            dbSessions.upsert(sessions[objSession], (err, result) => {
              if (err)
                return reject(err);
            });
        }
        return resolve();
      });
    },

    getLibraryEntry: (type, path) => {
      var root = fspath.join(libDir, type);
      var rootPath = fspath.join(libDir, type, path);
      return promiseDir(root).then(() => {
        return util.promisify(fs.lstat)(rootPath).then(stats => {
          if (stats.isFile()) {
            return getFileBody(root, path);
          }
          if (path.substr(-1) == '/') {
            path = path.substr(0, path.length - 1);
          }
          return util.promisify(fs.readdir)(rootPath).then(fns => {
            var dirs = [];
            var files = [];
            fns.sort().filter(function(fn) {
              var fullPath = fspath.join(path, fn);
              var absoluteFullPath = fspath.join(root, fullPath);
              if (fn[0] != ".") {
                var stats = fs.lstatSync(absoluteFullPath);
                if (stats.isDirectory()) {
                  dirs.push(fn);
                } else {
                  var meta = getFileMeta(root, fullPath);
                  meta.fn = fn;
                  files.push(meta);
                }
              }
              return null;
            });
            return dirs.concat(files);
          });
        }).catch(err => {
          if (type === "flows" && !/\.json$/.test(path)) {
            return storage.getLibraryEntry(type, path + ".json")
              .catch(e => {
                throw err;
              });
          }
          throw err;
        });
      });
    },

    saveLibraryEntry: (type, path, meta, body) => {
      if (settings.readOnly) {
        return Promise.resolve();
      }
      var fn = fspath.join(libDir, type, path);
      var headers = "";
      for (var i in meta) {
        if (meta.hasOwnProperty(i)) {
          headers += "// " + i + ": " + meta[i] + "\n";
        }
      }
      if (type === "flows" && settings.flowFilePretty) {
        body = JSON.stringify(JSON.parse(body), null, 4);
      }
      return promiseDir(fspath.dirname(fn)).then(() => {
        writeFile(fn, headers + body);
      });
    }
  };
  return storage;
};
