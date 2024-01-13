'use strict';

describe('routes', () => {
  const routes = require('.');

  let server;
  let services;
  beforeEach(() => {
    services = {
      documents: {
        createDocumentService: () => {},
        postDocumentService: () => {},
        getFederationNodes: () => {},
        getSecretKeyPart: () => {},
        saveSecretKeyPart: () => {},
        getDocumentService: () => {}
      },
      get: () => ({
        get: () => {},
        getTxID: () => {},
        getList: () => {}
      }),
      nsi: {
        getProviderNSIService: () => {},
        getAdminsOfOrgNSIService: () => {}
      },
      pubkeys: {
        getEmailsAndPubkeysService: () => {}
      },
      storage: {
        deleteFiles: () => {}
      }
    };
    server = {
      plugin_manager: {
        services
      },
      models: {
        projects: {
          find: () => ({
            then: () => ({
              catch: () => {}
            })
          })
        },
        uiObserver: {
          notifyObserversOf: () => ({
            then: () => ({
              catch: () => {}
            })
          })
        },
        User: {
          findOne: () => ({
            then: () => ({
              then: () => ({
                then: () => ({
                  catch: () => {}
                }),
                catch: () => {}
              })
            })
          })
        },
        user: {
          findById: () => ({
            then: () => ({
              then: () => ({
                then: () => ({
                  then: () => ({
                    then: () => ({
                      catch: () => {}
                    })
                  })
                })
              })
            })
          })
        },
        route: {
          findOne: () => ({
            then: () => ({
              catch: () => {}
            })
          })
        },
        emailSend: {
          find: () => {}
        },
        project: {
          findOne: () => ({
            then: () => {}
          })
        }
      }
    };
    routes.init(server, 'test');
  });

  describe.skip('status handler', () => {
    const req = {
      body: {
        keys: {
          forEach: () => {}
        },
        fileId: '',
        id: '',
        recipients: [],
        contractId: '',
        pubKey: '',
        federationNodeAddress: '',
        keyPart: '',
        timeout: '',
        index: {
          toString: () => ''
        },
        signedTx: {
          outputs: [{
            public_keys: ['F2P2J2GSkJXoHHsbucQwnXtfxFi31j3JFdFzzX5bo3wa']
          }]
        }
      },
      user: {
        id: '',
        email: '',
        username: ''
      },
      header: () => {},
      filename: '',
      sendername: '',
      query: {
        token: '',
        project: ''
      }
    };
    const res = {
      json: () => {},
      send: () => {},
      status: () => ({
        send: () => {},
        json: () => {}
      }),
      redirect: () => {},
      end: () => {}
    };
    const pluginInstance = {
      config: {
        get: () => {}
      }
    };

    it('route getProjects should be callable', () => {
      routes.getProjects(req, res);
    });
    // @todo: should be investigated
    /* it('route postCreateDocument should be callable', () => {
      routes.postCreateDocument(req, res);
    }); */
    it('route postPostDocument should be callable', () => {
      routes.postPostDocument(req, res);
    });
    it('route postFileContracts should be callable', () => {
      routes.postFileContracts(req, res);
    });
    it('route getEmailSend should be callable', () => {
      routes.getEmailSend(req, res);
    });
    it('route getEmailSendOld should be callable', () => {
      routes.getEmailSendOld(req, res);
    });
    it('route getSettings should be callable', () => {
      routes.getSettings(req, res, pluginInstance);
    });
    it('route postEmailSeen should be callable', () => {
      routes.postEmailSeen(req, res);
    });
    it('route getNsiProviders should be callable', () => {
      routes.getNsiProviders(req, res);
    });
    it('route postNsiEmailsAndPubkeys should be callable', () => {
      routes.postNsiEmailsAndPubkeys(req, res);
    });
    it('route postNsiStorageByFilesize should be callable', () => {
      routes.postNsiStorageByFilesize(req, res);
    });
    it('route postUpload should be callable', () => {
      routes.postUpload(req, res);
    });
    it('route postDownloadFinished should be callable', () => {
      routes.postDownloadFinished(req, res);
    });
    it('route getActionsDocumentDownload should be callable', () => {
      routes.getActionsDocumentDownload(req, res);
    });
    it('route postActionsGetFederationNodes should be callable', () => {
      routes.postActionsGetFederationNodes(req, res);
    });
    it('route postActionsGetSecretPart should be callable', () => {
      routes.postActionsGetSecretPart(req, res);
    });
    it('route postActionsSaveSecretPart should be callable', () => {
      routes.postActionsSaveSecretPart(req, res);
    });
    it('route postActionsDocumentMeta should be callable', () => {
      routes.postActionsDocumentMeta(req, res, pluginInstance);
    });
    it('route postActionsBlockDownload should be callable', () => {
      routes.postActionsBlockDownload(req, res);
    });
    it('route getStorageDeleteFiles should be callable', () => {
      routes.getStorageDeleteFiles(req, res);
    });
  });
});
