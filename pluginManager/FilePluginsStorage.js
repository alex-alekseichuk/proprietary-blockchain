'use strict';
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const yauzl = require("yauzl");
const logger = require('log4js').getLogger('pluginManager/FilePluginsStorage.js');
const glob = require("glob");
const lockfile = require("lockfile");

const wget = require('wget-improved');
const osTmpdir = require('os-tmpdir');

const AWS = require('aws-sdk');
const ProgressBar = require('progress');

const {promisify} = require('util');
var rmrf = promisify(fse.remove);

class FilePluginsStorage {
  constructor(id, title, services, parameters, i18n, lockUpdate) {
    let self = this;
    this._id = id;
    this._title = title;
    this._services = services;
    this._folder = parameters.folder;
    if (!path.isAbsolute(parameters.folder))
      this.plugins_dir = path.join(__dirname, '..', parameters.folder);
    logger.debug("Init plugin storage. Directory:", this.plugins_dir);
    this._lockFilePath = path.resolve(this.plugins_dir, "plugins.lock");
    this.lockUpdate = lockUpdate;
    try {
      fs.accessSync(this.plugins_dir);
    } catch (e) {
      fs.mkdirSync(this.plugins_dir);
    }

    this.simpleGit = require('simple-git')(this.plugins_dir);
    this._i18n = i18n;
    process.stdin.resume();

    /**
     * handler for exit from process
     */
    function exitHandler() {
      self.unlock();
    }

    this._lockedByStorage = false;
    this._mainLocked = false;

    // do something when app is closing
    process.on('exit', exitHandler);

    // catches ctrl+c event
    process.on('SIGINT', exitHandler);

    // catches uncaught exceptions
    process.on('uncaughtException', exitHandler);
  }

  get id() {
    return this._id;
  }

  get title() {
    return this._title;
  }

  get folder() {
    return this.plugins_dir;
  }

  downloadPack(zipUrl, eventEmitter) {
    return new Promise((resolve, reject) => {
      logger.debug('download from', zipUrl);
      var fileName = zipUrl.split("/");
      // fileName = fileName[fileName.length - 1].split('.')[0]; // todo!! filenames with dots

      fileName = fileName[fileName.length - 1];

      var src = zipUrl;
      var filepath = osTmpdir() + "/" + fileName;

      var options = {
        // see options below
      };
      var download = wget.download(src, filepath, options);
      download.on('error', err => {
        reject(err);
      });
      download.on('start', fileSize => {
        logger.debug(fileSize);
      });
      download.on('end', output => {
        if (eventEmitter) eventEmitter.emit("status", "download finish:" + output);

        return resolve(filepath);
      });

      download.on('progress', function(progress) {
        if (eventEmitter) eventEmitter.emit("status", "download:" + progress);
      });
    });
  }

  getKeyAndBucketFromUrl(url) {
    return new Promise((resolve, reject) => {
      logger.debug('download from s3', url, 'ID', process.env.AWS_ACCESS_KEY_ID,
        'Key', process.env.AWS_SECRET_ACCESS_KEY, 'Region', process.env.AWS_REGION);
      let split1 = url.split('://');
      if (split1.length < 2 || split1[0] != 's3')
        return reject('wrong s3 url');
      let split2 = split1[1].split('/');
      if (split2.length < 2)
        return reject('wrong s3 url');
      let bucket = split2.splice(0, 1)[0];
      let key = split2.join('/');
      return resolve({bucket, key});
    });
  }

  downloads3ByUrl(url) {
    return new Promise((resolve, reject) => {
      return this.getKeyAndBucketFromUrl(url).then(result => {
        let {bucket, key} = result;
        return this.downloads3(bucket, key);
      }).then(resolve).catch(reject);
    });
  }

  checkAwsCredentials() {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
      logger.trace("No AWS credenitials");
      logger.trace(`AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID}; AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY}; AWS_REGION: ${process.env.AWS_REGION};`);
      return;
    }
    return true;
  }

  downloads3(bucket, key) {
    return new Promise((resolve, reject) => {
      let self = this;
      if (!self.checkAwsCredentials()) {
        return reject(self._i18n.__('No AWS credentials'));
      }
      let keySplit = key.split('/');
      let fileName = keySplit.length > 0 ? keySplit[keySplit.length - 1] : key;
      let filepath = osTmpdir() + '/' + fileName;
      let s3 = new AWS.S3();
      let params = {
        Bucket: bucket,
        Key: key
      };
      logger.debug(self._i18n.__('download s3'), self._i18n.__('parameters'), params);

      s3.headObject(params, function(err, metadata) {
        logger.trace('metadata : ', metadata);
        if (err) {
          logger.trace(err);
          if (err.code === 'NotFound')
            return reject("S3 bucket not found.");
          return reject(err.message ? err.message : err);
        }
        var file = fs.createWriteStream(filepath);
        file.on('close', () => {
          logger.debug('finish write', filepath);
          return resolve(filepath);
        });
        file.on('error', err => {
          logger.debug("Error:", err);
          return reject(err);
        });
        logger.debug(self._i18n.__('Creating staging area', key, 'to', filepath));

        var len = metadata.ContentLength;
        var bar = new ProgressBar(self._i18n.__('Downloading [:bar] :rate/bps :percent :etas'), {
          complete: '=',
          incomplete: ' ',
          width: 20,
          total: len
        });
        s3.getObject(params).createReadStream().on("error", err => {
          logger.trace("Error Download from s3 failed:", err);
          reject(self._i18n.__("Download from s3 failed"));
        }).on("data", data => {
          bar.tick(data.length);
        }).pipe(file).on("error", err => {
          logger.trace("Error Download from s3 failed:", err);
          reject(self._i18n.__("Download from s3 failed"));
        });
      });
    });
  }

  listBuckets() {
    return new Promise((resolve, reject) => {
      let self = this;
      if (!self.checkAwsCredentials()) {
        return reject(self._i18n.__('No AWS credentials'));
      }
      let s3 = new AWS.S3();
      s3.listBuckets((err, data) => {
        if (err)
          return reject(err);
        resolve(data);
      });
    });
  }

  listBucketObjects(bucketName, prefix) {
    return new Promise((resolve, reject) => {
      let self = this;
      if (!self.checkAwsCredentials()) {
        return reject(self._i18n.__('No AWS credentials'));
      }
      var s3 = new AWS.S3();
      var params = {Bucket: bucketName};
      if (prefix)
        params.Prefix = prefix;
      logger.debug('listBucketObjects:', params);
      s3.listObjects(params, function(err, data) {
        if (err)
          return reject(err);
        resolve(data);
      });
    });
  }

  writeContent(content, fileName) {
    return new Promise((resolve, reject) => {
      let filepath = osTmpdir() + '/' + fileName;
      logger.trace("Write content", filepath);

      fs.writeFile(filepath, content, 'binary', function(err) {
        if (err) {
          logger.error(err);
          reject(err);
        }
        resolve(filepath);
      });
    });
  }

  getS3(bucket, key) {
    return new Promise((resolve, reject) => {
      if (!this.checkAwsCredentials())
        return reject(this._i18n.__('No AWS credentials'));
      let s3 = new AWS.S3();
      let params = {
        Bucket: bucket,
        Key: key
      };
      s3.getObject(params, (err, data) => {
        if (err) return reject(err);
        // logger.debug("Goted s3 data", data, data.Body.toString('utf-8'));
        try {
          let ret = JSON.parse(data.Body.toString('utf-8'));
          return resolve(ret);
        } catch (err) {
          return reject(err);
        }
      });
    });
  }

  getPluginNameByFile(filePath) {
    let ext = path.extname(filePath);
    logger.trace(ext);
    let pluginName = path.basename(filePath, ext);
    return {
      name: pluginName,
      ext: ext
    };
  }

  unpack(filePath, source, name) {
    return new Promise((resolve, reject) => {
      var self = this;
      let pluginFileInfo = self.getPluginNameByFile(filePath);
      let pluginName = name || pluginFileInfo.name;
      // let ext = pluginFileInfo.ext;
      logger.trace(pluginName);
      var pluginDir = path.resolve(this.plugins_dir, pluginName);
      if (!self.existsFolder(pluginName)) {
        fs.mkdirSync(pluginDir);
      }
      let pattern = this._folder + '/' + pluginName + "/**";
      logger.trace("pattern", pattern);
      glob(pattern, {nodir: true}, (err, files) => {
        if (err) logger.error(err);
        files = files.map(f => path.resolve(f));
        let checkFiles = files && files.length;
        logger.trace("Files:", files);

        yauzl.open(filePath, {lazyEntries: true}, (err, zipFile) => {
          if (err) return reject(err);
          zipFile.on("error", err => {
            logger.error(err);
            return reject(err);
          });

          zipFile.on("close", () => {
            logger.trace("Close write stream!");
            fs.writeFileSync(pluginDir + '/.ng-rt-source.json', '{ "source" : "' + source + '" }');
            return resolve(pluginName);
          });

          zipFile.readEntry();
          zipFile.on("entry", entry => {
            logger.trace("Unzip entry", entry.fileName);
            if (/\/$/.test(entry.fileName)) {
              let dirPath = path.resolve(pluginDir, entry.fileName);
              if (!self.existsFolder(pluginName + "/" + entry.fileName)) {
                fs.mkdirSync(dirPath);
                logger.trace("Mkdir", dirPath);
              }
              zipFile.readEntry();
            } else {
              // file entry
              let fileName = path.resolve(pluginDir, entry.fileName);
              if (checkFiles && files.indexOf(fileName) > -1) {
                logger.trace("File exist", fileName);
                zipFile.readEntry();
                return;
              }
              zipFile.openReadStream(entry, (err, readStream) => {
                if (err) return reject(err);
                readStream.on("end", () => {
                  zipFile.readEntry();
                });
                readStream.pipe(fs.createWriteStream(fileName));
              });
            }
          });
        });
      });
    });
  }

  source(pluginName) {
    return new Promise((resolve, reject) => {
      try {
        var sourceFile = path.resolve(this.plugins_dir, pluginName, '.ng-rt-source.json');
        var template = fs.readFileSync(sourceFile, 'utf-8');
        template = JSON.parse(template);
        logger.debug("source", template, "from", sourceFile);
        resolve(template.source);
      } catch (e) {
        logger.error("on get source", e);
        return resolve();
      }
    });
  }

  version(pluginName) {
    return new Promise((resolve, reject) => {
      try {
        var sourceFile = path.resolve(this.plugins_dir, pluginName, 'ng-rt-version');
        var template = fs.readFileSync(sourceFile, 'utf-8');
        resolve(template);
      } catch (e) {
        return resolve();
      }
    });
  }

  gitclone(url, branch) {
    return new Promise((resolve, reject) => {
      let self = this;
      logger.debug('git clone plugin', url);
      let opts = [];
      let pluginNames = url.split("/");
      let pluginName = pluginNames[pluginNames.length - 1];
      pluginNames.forEach(name => {
        if (name.indexOf(".git") > -1)
          pluginName = name;
      });
      pluginName = pluginName.replace(".git", "");
      let localPath = path.join(this.plugins_dir, pluginName);
      if (branch) {
        opts.push('-b');
        opts.push(branch);
      }

      this.simpleGit.clone(url, localPath, opts, function(error, result) {
        if (error) {
          return reject(error);
        }
        var sourceFile = path.resolve(self.plugins_dir, pluginName, '.ng-rt-source.json');
        fs.writeFileSync(sourceFile, '{ "source" : "' + url + (branch ? '#' + branch : '') + '" }');
        return resolve(pluginName);
      });
    });
  }

  getManifest(plugin) {
    logger.trace('get manifest');
    return this.getJson(plugin, "manifest.json");
  }

  getJson(plugin, filepath, encoding) {
    logger.trace('get json');
    let self = this;
    return new Promise((resolve, reject) => {
      if (!encoding)
        encoding = 'utf-8';
      var file = path.resolve(self.plugins_dir, plugin, filepath);
      fs.readFile(file, encoding, (err, text) => {
        // logger.debug('file readed', err, text);
        if (err) resolve();
        try {
          var data;
          data = JSON.parse(text);

          logger.trace(data);

          resolve(data);
        } catch (err) {
          reject('Error get ' + filepath + ' ' + err);
        }
      });
    });
    // });
  }

  removePluginDir(pluginName) {
    logger.trace('remove plugin dir ' + pluginName);
    return rmrf(path.resolve(this.plugins_dir, pluginName));
  }

  getText(plugin, filepath, encoding) {
    return new Promise((resolve, reject) => {
      if (!encoding)
        encoding = 'utf-8';
      try {
        var text = fs.readFileSync(this.plugins_dir + '/' + filepath, encoding);
        resolve(text);
      } catch (err) {
        reject('Error get ' + filepath + ': ' + err);
      }
    });
  }

  require(plugin, file) {
    var scriptPath = path.resolve(this.plugins_dir, plugin, file);
    delete require.cache[require.resolve(scriptPath)];
    logger.trace('require ', scriptPath);
    return require(scriptPath);
  }

  getAdded() {
    var self = this;
    return fs.readdirSync(self.plugins_dir).filter(function(file) {
      return fs.statSync(path.join(self.plugins_dir, file)).isDirectory();
    });
  }

  exists(plugin) {
    let pluginPath = path.resolve(this.plugins_dir, plugin);
    return fs.existsSync(path.resolve(pluginPath, "manifest.json"));
  }

  existsFolder(folderName) {
    let pluginPath = path.resolve(this.plugins_dir, folderName);
    return fs.existsSync(pluginPath);
  }

  publish(plugin) {
    var self = this;
    return new Promise((resolve, reject) => {
      if (fs.existsSync(path.resolve(this.plugins_dir, plugin))) {
        var fileSystem = require('fs');
        var archiver = require('archiver');
        var zipPath = osTmpdir() + "/" + plugin + '.zip';

        var output = fileSystem.createWriteStream(zipPath);
        var archive = archiver('zip');

        output.on('close', function() {
          fs.open(zipPath, 'r', function(status, fd) {
            if (status)
              return reject(status);
            const MAX_SIZE = self._services.get('configService').get('pluginFeed.publish.maxSize') || 10 * 1024 * 1024;
            var buffer = new Buffer(MAX_SIZE); // 10M max size of plugin
            fs.read(fd, buffer, 0, buffer.length, 0, function(err, bytes) {
              if (err)
                return reject(err);
              if (bytes >= MAX_SIZE)
                return reject({
                  message: 'Plugin zip file has too large size.'
                });
              if (bytes <= 0)
                return reject({
                  message: 'Plugin zip file is empty.'
                });
              const file = buffer.slice(0, bytes);
              resolve(file);
            });
          });
        });

        archive.on('error', function(err) {
          throw err;
        });

        archive.pipe(output);
        archive.glob('**/*', {
          ignore: ['**/node_modules', '**/node_modules/**', '**/bower_components', '**/bower_components/**'],
          cwd: path.resolve(self.plugins_dir, plugin)
        });
        archive.finalize();
      }
    });
  }

  hasFile(plugin, filePath) {
    try {
      var fpath = path.resolve(this.plugins_dir, plugin, filePath);
      fs.accessSync(fpath, fs.R_OK);
      return true;
    } catch (e) {
      return false;
    }
  }

  getFile(plugin, filePath) {
    return new Promise((resolve, reject) => {
      var sourceFile = path.resolve(this.plugins_dir, plugin, filePath);
      fs.readFile(sourceFile, 'utf-8', (err, text) => {
        if (err)
          return reject(err);
        return resolve(text);
      });
    });
  }

  lock(main) {
    return new Promise((resolve, reject) => {
      if (!this.lockUpdate)
        return resolve();
      if (this._lockedByStorage)
        return resolve();
      lockfile.lock(this._lockFilePath, err => {
        if (err) return reject(err);
        logger.trace("Lock ", this._lockFilePath, main ? "isMain" : "notMain");
        this._lockedByStorage = true;
        if (main) this._mainLocked = true;
        resolve();
      });
    });
  }

  unlock(main) {
    return new Promise((resolve, reject) => {
      if (!this._lockedByStorage)
        return resolve();
      if (!main && this._mainLocked)
        return resolve();
      lockfile.unlock(this._lockFilePath, err => {
        if (err) return reject(err);
        logger.trace("Unlock", this._lockFilePath, main ? "isMain" : "notMain");
        this._lockedByStorage = false;
        if (main) this._mainLocked = false;
        resolve();
      });
    });
  }

  checkLock(main) {
    return new Promise((resolve, reject) => {
      if (!this.lockUpdate)
        return resolve(false);
      if (!main && this._mainLocked)
        return resolve(false);
      if (this._lockedByStorage)
        return resolve(true);
      lockfile.check(this._lockFilePath, (err, isLocked) => {
        if (err) return reject(err);
        resolve(isLocked);
      });
    });
  }

  savePluginZip(pluginName, fileData) {
    return new Promise((resolve, reject) => {
      const filePath = path.resolve(osTmpdir(), pluginName + '-tmp.zip');
      fs.writeFile(filePath, Buffer.from(fileData), function(err) {
        if (err)
          return reject(err);
        resolve(filePath);
      });
    });
  }
}

module.exports = FilePluginsStorage;
