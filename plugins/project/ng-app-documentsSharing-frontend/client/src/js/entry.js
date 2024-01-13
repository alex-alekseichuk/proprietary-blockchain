"use strict";

/* global location, document, window, EventEmitter2, ajax */
/* eslint-disable no-unused-vars */

/**
 * entry point
 * decide which action to perform - upload or download document
 */

(() => {
  let params = location.hash.split('#token=');
  let spaEngine = document.querySelector('#documentsSharing');
  let logger = window.log4js.getLogger('ng-app-documentsSharing-frontend/entry');

  logger.debug('DS_feedback adding events!');
  window.emitters = window.emitters || {};
  window.emitters.documentsSharing = window.emitters.documentsSharing || {};
  if (!window.emitters.documentsSharing.fileDownload) {
    let dse = new EventEmitter2();
    let body = {};
    window.emitters.documentsSharing.fileDownload = dse;
    dse.on('props', props => {
      if (props) Object.assign(body, props);
    });
    dse.on('print', props => {
      if (props) Object.assign(body, props);
      logger.trace('Documents Sharing event props = ' + JSON.stringify(body));
    });
    dse.on('downloadFinished', props => {
      if (props) Object.assign(body, props);
      props = body;
      body = {};
      ajax.post('/ng-app-documentsSharing-backend/downloadFinished', props, res => {
        logger.trace('documentsSharing/downloadFinished posted! res = ' + JSON.stringify(res));
        location.replace(location.href.replace(/#token.*$/g, ''));
      });
    });
  }

  if (params.length === 2) {
    spaEngine.initAction("downloadDocument", "showPage", {token: params[1]});
  } else {
    spaEngine.initAction("app", "showPage");
  }
}).call(this);

var docSharingModule;
