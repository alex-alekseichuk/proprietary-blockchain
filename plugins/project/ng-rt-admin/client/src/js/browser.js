'use strict';

/* global window */
/* global project */
/* global bowser */

(function() {
  if (!window.browserUtils) {
    window.browserUtils = {
      checkBrowser() {
        return new Promise((resolve, reject) => {
          project.ajax.get('/ng-rt-core/config/ng-rt-admin/client', (res, xhr) => {
            if (xhr.status == 200 && res.browserversions) {
              if (res.browserversions.some(item => (item.name === bowser.name && !(new RegExp(item.version)).test(bowser.version)))) {
                return reject();
              }
            }
            return resolve();
          });
        });
      }
    };
  }
})();
