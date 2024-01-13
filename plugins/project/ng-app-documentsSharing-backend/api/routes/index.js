'use strict';

const logger = require('log4js').getLogger('app-documents-routes');
const path = require('path');
const _ = require('lodash');
const Promise = require('bluebird');
const express = require('express');

/* eslint-disable handle-callback-err */

let server;
let plugin;
let services;

const init = (_server, _plugin) => {
  server = _server;
  plugin = _plugin;
  services = require('../services')(server);
};

const getProjects = (req, res) => {
  logger.info('GET /ng-app-documentsSharing/projects');
  server.models.projects.find()
    .then(projects => res.json(projects))
    .catch(err => {
      res.json({
        success: false,
        error: err.message
      });
    });
};

const postCreateDocument = (req, res) => {
  services.documents.createDocumentService(req.body, req.user.id, req.headers)
    .then(data => res.send(data))
    .catch(err => {
      res.send({variant: "ERROR", result: err});
    });
};

const postPostDocument = (req, res) => {
  services.documents.postDocumentService(req.body)
    .then(data =>
      res.send(data))
    .catch(err => {
      res.send({variant: "ERROR", result: err});
    });
};

const postFileContracts = (req, res) => {
  let services = server.plugin_manager.services;
  let configService = services.get('configService');
  const contracts = require('./contracts')(configService);
  return contracts.get(req.body.fileid)
    .then(access => {
      res.json({
        fileid: req.body.fileid,
        access
      });
    })
    .catch(err => {
      logger.debug('ERR:', err);
    });
};

const getEmailSend = (req, res) => {
  let emailsGlob = [];
  server.models.User.findOne({where: {id: req.user.id}})
    .then(user => {
      logger.info('found user =', user);
      req.user.email = user.email;
      return server.models.emailSend.find({where: {template: 'documentSharing'}});
    })
    .then(emails => {
      // logger.info('emailSend emails =', emails);
      logger.info('emailSend req.user =', req.user);
      emails = emails.filter(email => Array.isArray(email.emails) ?
        email.emails.indexOf(req.user.email) !== -1 : email.emails == req.user.email
      );
      let services = server.plugin_manager.services;
      let configService = services.get('configService');
      // const contracts = require('./contracts')(configService);
      logger.info('publicDNSName =', configService.get('publicDNSName'));
      // let parr = [];
      emails.forEach(email => {
        email.payload = email.payload || {};
        email.payload.href = configService.get('publicDNSName') +
          '/ng-app-documentsSharing-backend/actions/document/download?token=' +
          email.payload.fileid;
        // let p = contracts.get(email.payload.fileid);
        // parr.push(p);
        // p.then(res => {
        //   email.contracts = res;
        // })
      });
      emailsGlob = emails;
      // logger.info('emails =', emails);
      // return Promise.all(parr);
    })
    .then(() => {
      // logger.info('emailsGlob =', emailsGlob);
      res.json({
        success: true,
        emails: emailsGlob
      });
    })
    .catch(err => {
      res.json({
        success: false,
        error: err.message
      });
    });
};

const getEmailSendOld = (req, res) => {
  server.models.User.findOne({where: {id: req.user.id}})
    .then(user => {
      logger.info('found user =', user);
      req.user.email = user.email;
      return server.models.emailSend.find({});
    })
    .then(emails => {
      logger.info('emailSend emails =', emails);
      logger.info('emailSend req.user =', req.user);
      emails = emails.filter(email => Array.isArray(email.emails) ?
        email.emails.indexOf(req.user.email) !== -1 : email.emails == req.user.email
      );
      let services = server.plugin_manager.services;
      let configService = services.get('configService');
      logger.info('publicDNSName =', configService.get('publicDNSName'));
      emails.forEach(email => {
        email.payload = email.payload || {};
        email.payload.href = configService.get('publicDNSName') +
          '/ng-app-documentsSharing-backend/actions/document/download?token=' +
          email.payload.fileid;
      });
      logger.info('email =', emails);
      res.json({
        success: true,
        emails
      });
    })
    .catch(err => {
      res.json({
        success: false,
        error: err.message
      });
    });
};

const getSettings = (req, res, pluginInstance) => {
  logger.info('GET /ng-app-documentsSharing/settings');
  res.json({
    success: true,
    settings: {
      hideinbox: pluginInstance.config.get('hideinbox')
    }
  });
};

const postEmailSeen = (req, res) => {
  logger.debug('id =', req.body.id);
  server.models.User.findOne({where: {id: req.user.id}})
    .then(user => {
      logger.info('found user =', user);
      req.user.email = user.email;
      return server.models.emailSend.findOne({where: {id: req.body.id}});
    })
    .then(email => {
      logger.info('emailSeen emal =', email);
      logger.info('emailSeen req.user =', req.user);
      if (Array.isArray(email.emails) ?
          email.emails.indexOf(req.user.email) == -1 : email.emails !== req.user.email
      ) throw new Error('Not your email');
      email.payload = email.payload || {};
      email.payload.seen = email.payload.seen || [];
      if (email.payload.seen.indexOf(req.user.email) == -1) email.payload.seen.push(req.user.email);
      return email.save();
    })
    .then(email => {
      res.json({
        success: true,
        email
      });
    })
    .catch(err => {
      res.json({
        success: false,
        error: err.message
      });
    });
};

const getNsiProviders = (req, res) => {
  res.send(services.nsi.getProviderNSIService());
};

const postNsiEmailsAndPubkeys = (req, res) => {
  Promise.all([
    services.pubkeys.getEmailsAndPubkeysService(req.body.recipients),
    services.nsi.getAdminsOfOrgNSIService(req.user.id)
  ])
    .then(data => {
      res.send({
        variant: "OK",
        unknown_emails: _.chain(data).head().get('unknown_emails', []).value(),
        result: _.chain(data)
          .head()
          .get('result')
          .union(
            _.chain(data).last().get('result', []).value()
          )
          .reject(_.isEmpty)
          .value()
      });
    });
};

const postNsiStorageByFilesize = (req, res) => {
  const serviceManager = server.plugin_manager.services;
  const configService = serviceManager.get('configService');
  const databaseType = configService.get('databaseType');

  res.send({
    storage: databaseType // hardcore mongodb
  });
  // services.storage.getByFileSizeStorageService(Number(req.body.fileSize))
  //   .then(ctx => {
  //     res.send({
  //       storage: ctx.storage
  //     });
  //   });
};

const postUpload = (req, res) => {
  if (!req.body) {
    return res.status(400).send({message: "No content"});
  }
  let fileId = req.header('fileId');
  const index = req.header('index');
  const filesize = req.header('filesize');

  const serviceManager = server.plugin_manager.services;
  const storageProvidersService = serviceManager.get('storageProviders');
  const configService = serviceManager.get('configService');
  const databaseType = configService.get('databaseType');
  const provider = storageProvidersService.get(databaseType); // hardcode mongodb
  if (!provider) {
    return res.status(400).send({message: `No ${databaseType} provider`});
  }
  if (!provider.storeBlock) {
    return res.status(400).send({message: 'No storeBlock method'});
  }

  // Store file function
  let upload = function() {
    provider.storeBlock(fileId, index, req.body)
      .then(fileId => res.send({fileId: fileId}))
      .catch(err => res.status(500).send(err));
  };

  // Get billing/subscription service
  const billingService = serviceManager.get('billing.service');
  if (!billingService) {
    return upload();
  }
  const subscriptionService = billingService.subscription;

  // Get features
  subscriptionService.getFeatures(plugin, req.user.id)
    .then(subscription => {
      if (subscription.enabled) {
        logger.debug('Features', subscription.features);

        // Get billing plan for filesize feature
        let filesizeFeature = subscription.features.find(item => item.featureId === 'filesize');
        let featureValue;

        // Check if filesize exceeds limit
        // For premium plan featureValue is 0 (unlimited)
        if (filesizeFeature && filesizeFeature.featureValue) {
          logger.debug(`Filesize: ${filesize}, limit: ${filesizeFeature.featureValue}`);
          featureValue = Number(filesizeFeature.featureValue);
          if (filesize > featureValue && featureValue !== 0) {
            return Promise.reject(`Filesize exceeds limit for ${filesizeFeature.featureValue} bytes`);
          }
        }

        // If no filesizeFeature or filesize is ok, then just resolve()
        return Promise.resolve();
      }
      return Promise.resolve();
    })
    .then(() => upload())
    .catch(err => {
      res.status(500).json({err});
    });
};

const postDownloadFinished = (req, res) => {
  logger.debug('downloadFinished, props =', req.body);
  logger.debug('downloadFinished, user =', req.user);
  if (!req.body.filename) {
    logger.warn('no filename, sendername =', req.body.sendername);
    return res.status(400).json({success: false, error: 'no filename'});
  }
  if (!req.body.sendername) {
    logger.warn('no sendername, filename =', req.body.filename);
    return res.status(400).json({success: false, error: 'no sendername'});
  }
  return server.models.User.findOne({where: {username: req.body.sendername}})
    .then(sender => {
      logger.trace('sender.email =', sender.email);
      if (!sender.email) {
        logger.error('no senderemail, snedername =', req.body.sendername);
        return res.status(500).json({success: false, error: 'no senderemail'});
      }
      return server.models.uiObserver.notifyObserversOf('DS_feedback', {
        topic: 'Shared File downloaded',
        recepient: sender.email,
        payload: {
          username: req.user.username,
          filename: req.body.filename,
          subject: 'Shared file ' + req.body.filename + ' downloaded'
        }
      }).then(res => {
        logger.info('ds feedback res =', res);
        res.json({success: true});
      }).catch(err => {
        logger.info('ds feedback error =', err);
        res.json({success: false, error: err.message});
      });
    });
};

const getActionsDocumentDownload = (req, res) => {
  logger.debug(req.query);
  server.models.route.findOne({
    where: {
      route: 'documentsSharing'
    }
  }).then(route => {
    res.redirect(`/admin/#!/admin/pluginsdisplay/${route.id}#token=${req.query.token}`);
  }).catch(err => {
    res.redirect('/');
  });
};

const postActionsGetFederationNodes = (req, res) => {
  logger.debug('/actions/get-federation-nodes');
  const {contractId} = req.body;
  services.documents.getFederationNodes(contractId, req.headers, function(data) {
    res.send(data);
  });
};

const postActionsGetSecretPart = (req, res) => {
  logger.debug('/actions/get-secret-part');
  const {pubKey, contractId, federationNodeAddress} = req.body;
  services.documents.getSecretKeyPart(contractId, pubKey, federationNodeAddress, req.headers, function(data) {
    res.send(data);
  });
};

const postActionsSaveSecretPart = (req, res) => {
  logger.debug('/actions/save-secret-part');
  const {pubKey, contractId, federationNodeAddress, keyPart, timeout} = req.body;
  services.documents.saveSecretKeyPart(contractId, pubKey, federationNodeAddress, keyPart, timeout, req.headers, function(data) {
    res.send(data);
  });
};

const postActionsDocumentMeta = async (req, res, pluginInstance) => {
  logger.debug('/actions/document/meta');
  const {id} = req.body;
  let data = await services.documents.getDocumentService(id);
  data.maxBlobDownload = pluginInstance.config.get('maxBlobDownload');
  logger.debug('super then', data);
  res.send(data);
};

const postActionsBlockDownload = (req, res) => {
  const serviceManager = server.plugin_manager.services;
  const storageProvidersService = serviceManager.get('storageProviders');
  const configService = serviceManager.get('configService');
  const databaseType = configService.get('databaseType');
  const provider = storageProvidersService.get(databaseType);
  if (!provider) {
    return res.status(500).send({message: `No mongodb provider`});
  }
  if (!provider.getBlock) {
    return res.status(500).send({message: 'No storeBlock method'});
  }
  provider.getBlock(req.body.fileId, req.body.index.toString())
    .then(data => {
      res.send(new Buffer(data));
    })
    .catch(err => {
      logger.error(err);
      res.status(500).send({variant: "ERROR", result: err});
    });
};

const getStorageDeleteFiles = (req, res) => {
  logger.debug("Delete files for project :", req.query.project);

  services.storage.deleteFiles(req.query.project, function(result) {
    try {
      result = JSON.parse(result);
    } catch (e) {

    }

    res.end(result.toString());
  });
};

const activate = (server, plugin, pluginInstance) => {
  init(server, plugin);

  let dsRouter = new express.Router();

  /** static **/
  dsRouter.use('/', server.loopback.static(path.resolve(pluginInstance.path.absolute, 'client', 'public')));
  dsRouter.use('/locales',
    server.loopback.static(path.resolve(pluginInstance.path.absolute, 'api', 'config', 'locales')));

  logger.trace('dsRouter plugin =', plugin);

  /**
   * Get projects
   *
   * @name Get public part of plugin specific settings
   * @route {GET} /${namespace}/settings
   * @authentication Requires an valid Session Token
   */
  dsRouter.get('/projects', server.ensureLoggedIn(), getProjects);

  /**
   * Create new document
   *
   * @name Create new document
   * @route {POST} /createDocument
   * @authentication server.ensureLoggedIn() Vaild User session
   * @bodyparam {object} req.body Document
   */
  dsRouter.post('/createDocument', server.ensureLoggedIn(), postCreateDocument);

  /**
   * Post created document
   *
   * @name Post created document
   * @route {POST} /postDocument
   * @authentication server.ensureLoggedIn() Vaild User session
   * @bodyparam {object} req.body Document
   */
  dsRouter.post('/postDocument', server.ensureLoggedIn(), postPostDocument);

  /**
   * Get file contracts
   *
   * @name Get file contracts
   * @route {POST} /fileContracts
   * @authentication server.ensureLoggedIn() Vaild User session
   * @bodyparam {string} fileId File ID
   */
  dsRouter.post('/fileContracts', server.ensureLoggedIn(), postFileContracts);

  /**
   * Send email
   *
   * @name Send email
   * @route {GET} /emailSend
   * @authentication server.ensureLoggedIn() Vaild User session
   */
  dsRouter.get('/emailSend', server.ensureLoggedIn(), getEmailSend);

  dsRouter.get('/emailSendOld', server.ensureLoggedIn(), getEmailSendOld);

  /**
   * Get public part of plugin specific settings
   *
   * @name Get public part of plugin specific settings
   * @route {GET} /${namespace}/settings
   * @authentication Requires an valid Session Token
   */
  dsRouter.get('/settings', server.ensureLoggedIn(), (req, res) => {
    getSettings(req, res, pluginInstance);
  });

  /**
   * Email seen
   *
   * @name Email seen
   * @route {POST} /emailSeen
   * @authentication server.ensureLoggedIn() Vaild User session
   * @bodyparam {object} id ID
   */
  dsRouter.post('/emailSeen', server.ensureLoggedIn(), postEmailSeen);

  /**
   * Get list of NSI providers
   *
   * @name Get list of NSI providers
   * @route {GET} /nsi/providers
   * @authentication server.ensureLoggedIn() Vaild User session
   */
  dsRouter.get('/nsi/providers', server.ensureLoggedIn(), getNsiProviders);

  /**
   * Emails and Pubkeys
   *
   * @name Emails and Pubkeys
   * @route {POST} /nsi/emailsAndPubkeys
   * @authentication server.ensureLoggedIn() Vaild User session
   * @bodyparam {String} recipients Array of reciepients
   * @bodyparam {String} id Id of the organization to retrieve all defined admins
   */
  dsRouter.post('/nsi/emailsAndPubkeys', server.ensureLoggedIn(), postNsiEmailsAndPubkeys);

  /**
   * Determine storageProvider
   *
   * @name Determine storageProvider
   * @route {POST} /nsi/storageByFilesize
   * @authentication server.ensureLoggedIn() Vaild User session
   */
  dsRouter.post('/nsi/storageByFilesize', postNsiStorageByFilesize);

  /**
   * Upload the document
   *
   * @name Upload the document
   * @route {POST} /upload
   * @authentication server.ensureLoggedIn() Vaild User session
   * @headerparam {string} fileId
   * @headerparam {string} index
   */
  dsRouter.post('/upload', server.ensureLoggedIn(), postUpload);

  /**
   * Post the event that the download is finished. This will trigger a mail via node-red to the sender
   *
   * @name Post the event that the download is finished
   * @route {POST} /downloadFinished
   * @authentication server.ensureLoggedIn() Vaild User session
   * @bodyparm {string} filename Filename
   * @bodyparm {string} sendername Name of the sender
   */
  dsRouter.post('/downloadFinished', server.ensureLoggedIn(), postDownloadFinished);

  /**
   * Redirect the reuqest to download a document
   *
   * @name Redirect the reuqest to download a document
   * @route {GET} /actions/document/download
   * @authentication none
   * @queryparm {query} token Token
   */
  dsRouter.get('/actions/document/download', getActionsDocumentDownload);

  /**
   * Download document data
   *
   * @name Download document data
   * @route {post} /actions/get-secret-part
   * @authentication none
   * @query {string} contractId Id of the contract
   */
  dsRouter.post('/actions/get-federation-nodes', postActionsGetFederationNodes);

  /**
   * Download document data
   *
   * @name Download document data
   * @route {post} /actions/get-secret-part
   * @authentication none
   * @query {string} contractId Id of the contract
   * @query {string} federationNodeAddress address of the federation node to get key part from
   * @query {string} pubKey Publickey
   */
  dsRouter.post('/actions/get-secret-part', postActionsGetSecretPart);

  /**
   * Download document data
   *
   * @name Download document data
   * @route {post} /actions/get-secret-part
   * @authentication none
   * @query {string} contractId Id of the contract
   * @query {string} federationNodeAddress address of the federation node to get key part from
   * @query {string} pubKey Publickey
   */
  dsRouter.post('/actions/save-secret-part', postActionsSaveSecretPart);

  /**
   * Download document data
   *
   * @name Download document data
   * @route {post} /actions/document/meta
   * @authentication none
   * @query {string} id Id of teh document
   * @query {string} pubKey Publickey
   */
  dsRouter.post('/actions/document/meta', (req, res) => {
    postActionsDocumentMeta(req, res, pluginInstance);
  });

  /**
   * Download document blocks
   *
   * @name Download document blocks
   * @route {post} /actions/block/download
   * @authentication none
   * @bodyparm {string} fileId Id of the document
   * @bodyparm {string} index Index to be downloaded
   * @return {void} data
   */
  dsRouter.post('/actions/block/download', postActionsBlockDownload);

  /**
   * Delete Files of a project in the storageProvider
   *
   * @name Delete Files of a project in the storageProvider
   * @route {GET} /storage/deleteFiles
   * @authentication server.ensureUserRoles(["admin"] Vaild User session with role Admin
   * @queryparm {string} project Id of the project
   */
  dsRouter.get('/storage/deleteFiles', server.ensureUserRoles(["admin"]), getStorageDeleteFiles);

  server.use(`/${plugin}`, dsRouter);
};

/**
 * API/Route/DocumentSharing
 *
 * @module API/Route/DocumentSharing
 * @type {object}
 */
module.exports = {
  init,
  activate,
  getProjects,
  postCreateDocument,
  postPostDocument,
  postFileContracts,
  getEmailSend,
  getEmailSendOld,
  getSettings,
  postEmailSeen,
  getNsiProviders,
  postNsiEmailsAndPubkeys,
  postNsiStorageByFilesize,
  postUpload,
  postDownloadFinished,
  getActionsDocumentDownload,
  postActionsGetFederationNodes,
  postActionsGetSecretPart,
  postActionsSaveSecretPart,
  postActionsDocumentMeta,
  postActionsBlockDownload,
  getStorageDeleteFiles
};
