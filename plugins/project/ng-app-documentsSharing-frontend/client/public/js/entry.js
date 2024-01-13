"use strict";

/* global location, document, window, EventEmitter2, ajax */
/* eslint-disable no-unused-vars */

/**
 * entry point
 * decide which action to perform - upload or download document
 */

(function () {
  var params = location.hash.split('#token=');
  var spaEngine = document.querySelector('#documentsSharing');
  var logger = window.log4js.getLogger('ng-app-documentsSharing-frontend/entry');

  logger.debug('DS_feedback adding events!');
  window.emitters = window.emitters || {};
  window.emitters.documentsSharing = window.emitters.documentsSharing || {};
  if (!window.emitters.documentsSharing.fileDownload) {
    var dse = new EventEmitter2();
    var body = {};
    window.emitters.documentsSharing.fileDownload = dse;
    dse.on('props', function (props) {
      if (props) Object.assign(body, props);
    });
    dse.on('print', function (props) {
      if (props) Object.assign(body, props);
      logger.trace('Documents Sharing event props = ' + JSON.stringify(body));
    });
    dse.on('downloadFinished', function (props) {
      if (props) Object.assign(body, props);
      props = body;
      body = {};
      ajax.post('/ng-app-documentsSharing-backend/downloadFinished', props, function (res) {
        logger.trace('documentsSharing/downloadFinished posted! res = ' + JSON.stringify(res));
        location.replace(location.href.replace(/#token.*$/g, ''));
      });
    });
  }

  if (params.length === 2) {
    spaEngine.initAction("downloadDocument", "showPage", { token: params[1] });
  } else {
    spaEngine.initAction("app", "showPage");
  }
}).call(this);

var docSharingModule;