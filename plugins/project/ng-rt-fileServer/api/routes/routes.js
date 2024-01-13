/* eslint-disable no-loop-func */
'use strict';

const logger = require('log4js').getLogger('ng-rt-filesServer-routes');
const path = require('path');
const multer = require('multer');

/**
 * API/Route/ng-rt-fileServer
 *
 * @module API/Route/ng-rt-fileServer
 * @type {Object}
 */
module.exports = {
  activate: (server, plugin) => {
    logger.debug('remove fileUpload service cache 1');
    delete require.cache[require.resolve('../../server/fileUpload.js')];
    const fileUpload = require('../../server/fileUpload.js')();
    logger.debug(fileUpload);
    logger.debug('ng-rt-filesServer-routes');

    const configService = server.plugin_manager.services.get('configService');
    const defaultDatabase = configService.get('databaseType');
    const settings = server.plugin_manager.configs.get(plugin);
    const uploadFolder = settings.get('uploadFolder');
    const maxFileSize = settings.get('limits.maxFileSize');
    const routeUpload = settings.get('routeUpload');
    const routeDownload = settings.get('routeDownload');
    const namespace = settings.get('namespace');
    const allowedMimetypes = new RegExp(settings.get('fileFilter.allowedMimetypes'), 'i');
    const uploadFolderPath = server.plugin_manager.configs.data(plugin).path.relative;

    let storage = multer.diskStorage({
      destination: function(req, file, cb) {
        cb(null, path.join(uploadFolderPath, uploadFolder));
      },
      filename: function(req, file, cb) {
        cb(null, file.originalname);
      }
    });

    let upload = multer({
      storage: storage,
      limits: {
        fileSize: maxFileSize // Filezise in Byte
      },
      fileFilter: function(req, file, cb) {
        let mimetype = allowedMimetypes.test(file.mimetype);

        if (mimetype) {
          return cb(null, true);
        }
        cb("Error: File upload only supports the following mimetypes - " + allowedMimetypes);
      }
    });
    /**
     *
     * @param {object} req - request as parameter
     * @param {object} res - response as parameter
     * @param {object} next - skip
     */
    function extendTimeout(req, res, next) {
      res.setTimeout(480000, function() { /* Handle timeout */ });
      next();
    }

    /**
     * Upload a file (or files)
     *
     * @name File upload
     * @route {POST} /fileServer/upload
     * @authentication Requires an Application Token for authentication
     * @bodyparam {Array} req.files Array of files to upload
     * @bodyparam {Json} metadata JSON of metadata
     *
     * @example
     * * javascript:
     *
     * request an Authorization token for an Application key
     *
     * function authorize() {
     *  return new Promise((resolve, reject) => {
     *    rest.post("http://playground.project.com/auth/applogin", {
     *    data: {
     *      appID: "ng-rt-fileServer",
     *      appKey: "04gsc4fts78r2nejatt67b89cgi0kqj83ah2hcnftd90l2ob7f"
     *    }
     *  }).on("complete", function(data, res) {
     *    if (res.statusCode != 200)
     *      return reject("error");
     *      return resolve(data.token);
     *    });
     *  });
     * }
     *
     * Upload a file
     *
     * fs.stat(filePath, function(err, stats) {
     *  rest.post("http://playground.project.com/auth/applogin", {
     *    data: {
     *     appID: "ng-rt-fileServer",
     *     appKey: "04gsc4fts78r2nejatt67b89cgi0kqj83ah2hcnftd90l2ob7f"
     *    }
     *  }).on("complete", function(data, res) {
     *    console.log("data", data, "res", res.statusCode);
     *    rest.post("http://playground.project.com/fileServer/upload", {
     *      multipart: true,
     *      headers: {
     *        Authorization: "JWT " + data.token
     *      },
     *      data: {
     *        folder_id: "0",
     *        filename: rest.file(filePath, null, stats.size, null, "plain/text")
     *      },
     *      metadata: {
     *        domainID: "D01"
     *      }
     *    }).on("complete", function(data, response) {
     *      console.log(data);
     *    });
     *  });
     * });
     *
     */

    /**
     *
     * @param {object} req request instance
     * @param {object} res response instance
     * @param {function} next continue function
     * @return {undefined}
     */
    const postUpload = (req, res, next) => {
      logger.debug(`/${namespace}/${routeUpload}`);

      logger.debug('req.files : ' + JSON.stringify(req.files));

      if (!req.files) {
        return res.status(400).send('Error: no files sent');
      }
      logger.debug('# of files : ' + req.files.length);

      for (var x = 0; x < req.files.length; x++) {
        logger.debug('Originalname :', req.files[x].originalname);

        let originalname = req.files[x].originalname;
        let fileLength = req.files.length;

        fileUpload.save(server, plugin, req.files[x].originalname, req.body.storage ? req.body.storage : defaultDatabase).then(fileId => {
          res.send({
            status: "Done",
            file: originalname,
            files: x,
            total: fileLength,
            fileId: fileId
          });
        }).catch(error => {
          logger.error(error);
          res.status(500);
          res.write(error);
          res.end();
        });
      }
    };

    server.post(`/${namespace}/${routeUpload}`, server.ensureLoggedIn(), extendTimeout, upload.any(), postUpload);

    server.post(`/${namespace}/app/${routeUpload}`, server.ensureApplication(plugin), extendTimeout, upload.any(), postUpload);

    /**
     * Download a file
     *
     * @name File download
     * @route {GET} /fileServer/download
     * @authentication Requires an Application Token for authentication
     * @queryparam {String} id File ID
     *
     * @example
     * javascript:
     *
     * request an Authorization token for an Application key
     *
     * function authorize() {
     *  return new Promise((resolve, reject) => {
     *    rest.post("http://playground.project.com/auth/applogin", {
     *    data: {
     *      appID: "ng-rt-fileServer",
     *      appKey: "04gsc4fts78r2nejatt67b89cgi0kqj83ah2hcnftd90l2ob7f"
     *    }
     *  }).on("complete", function(data, res) {
     *    if (res.statusCode != 200)
     *      return reject("error");
     *      return resolve(data.token);
     *    });
     *  });
     * }
     *
     * request the file to de downloaded
     *
     * rest.get('http://playground.project.com/fileServer/download/?id=' + fileId, {
     *  accessToken: authHeader
     * }).on('complete', function(data) {
     *  var pdfFile = new Uint8Array(data.file);
     *  console.log(data);
     *  file.write(uint8ToBase64(pdfFile), 'binary'); // auto convert to object
     *  file.end();
     * });
     *
     */

    /**
     *
     * @param {object} req request instance
     * @param {object} res response instance
     * @param {function} next continue function
     * @return {undefined}
     */
    const getDownload = (req, res, next) => {
      logger.debug(`/${namespace}/${routeDownload}`);

      if (!req.query.id) {
        return res.status(400).send('Error: no file ID defined');
      }

      logger.debug(req.query.id);
      let id = req.query.id;
      let storageProvidersService = global.serviceManager.get('storageProviders');
      storageProvidersService.get('main')
        .getFile(id).then(result => {
          if (result.file) {
            res.status(200);
            res.send(result.file);
            return;
          }
          // stream.on("data", data => {
          //   logger.debug("data");
          //   res.write(data);
          // });
          // stream.on("end", () => {
          //   logger.debug("END!");
          //   res.end();
          // });
        }).catch(err => {
          logger.error(err);
          res.status(500);
          res.write(err);
          res.end();
        });
    };

    server.get(`/${namespace}/${routeDownload}`, server.ensureLoggedIn(plugin), extendTimeout, getDownload);

    server.get(`/${namespace}/app/${routeDownload}`, server.ensureApplication(plugin), extendTimeout, getDownload);
  },
  deactivate: {
    upload: {
      path: "/fileServer/upload",
      type: "post"
    },
    download: {
      path: "/fileServer/download",
      type: "get"
    },
    uploadApp: {
      path: "/fileServer/app/upload",
      type: "post"
    },
    downloadApp: {
      path: "/fileServer/app/download",
      type: "get"
    }
  }
};
