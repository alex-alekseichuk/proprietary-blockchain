'use strict';
const getAdminsOfOrgNSIService = require('./nsi/getAdminsOfOrgNSIService.js');
const getProviderNSIService = require('./nsi/getProviderNSIService.js');
const getEmailsAndPubkeysService = require('./pubkeys/getEmailsAndPubkeysService.js');
const getDocumentService = require('./documents/getDocumentService.js');
const getSecretKeyPart = require('./documents/getSecretKeyPart.js');
const saveSecretKeyPart = require('./documents/saveSecretKeyPart.js');
const getFederationNodes = require('./documents/getFederationNodes.js');
const createDocumentService = require('./documents/createDocumentService.js');
const postDocumentService = require('./documents/postDocumentService.js');
const getByFileSizeStorageService = require('./storage/getByFileSizeStorageService.js');
const deleteFiles = require('./storage/deleteFiles.js');
const _ = require('lodash');

/**
 * @type {factory}
 * @param server - server's instance
 */

module.exports = server => {
  return {
    documents: {
      getDocumentService: _.bind(getDocumentService, null, server.plugin_manager.services),
      getSecretKeyPart: _.bind(getSecretKeyPart, null, server.plugin_manager.services),
      saveSecretKeyPart: _.bind(saveSecretKeyPart, null, server.plugin_manager.services),
      getFederationNodes: _.bind(getFederationNodes, null, server.plugin_manager.services),
      createDocumentService: _.bind(createDocumentService, null, server.plugin_manager.services, server.models),
      postDocumentService: _.bind(postDocumentService, null, server.plugin_manager.services, server.models)
    },
    nsi: {
      getAdminsOfOrgNSIService: _.bind(getAdminsOfOrgNSIService, null, server.models),
      getProviderNSIService: _.bind(getProviderNSIService, null, server.plugin_manager.services)
    },
    pubkeys: {
      getEmailsAndPubkeysService: _.bind(getEmailsAndPubkeysService, null, server.models)
    },
    storage: {
      getByFileSizeStorageService: _.bind(getByFileSizeStorageService, null, server.models),
      deleteFiles: _.bind(deleteFiles, null, server.plugin_manager.services, server.models)
    }
  };
};
