/**
 * Gulp tasks
 */
'use strict';

module.exports = {
  gulpOptions: {
    userguides: {
      includes: ['enduser'],
      outputHtml: true,
      outputEpub: true,
      outputPdf: true
    },
    buildVue: true
  },
  defineCustomGulpTasks(gulp, options, gulpUtils) {
    gulp.task('customBuildClient', gulp.parallel([
      gulpUtils.copyToPublic('copy-web-sdk', '../node_modules/ng-rt-client-web-sdk/lib/ng-rt-client-web-sdk.js', 'js')
    ]));
  }
};