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
    }
  },
  defineCustomGulpTasks(gulp, options, gulpUtils) {
    gulp.task('customBuildClient', gulp.parallel([
      gulpUtils.copyToPublic('copy-transfer', 'src/transfer.html', '')
    ]));
  }
};
