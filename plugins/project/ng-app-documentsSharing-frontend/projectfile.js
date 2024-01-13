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
    gulp.task('customBuildClient', gulp.series([
      gulpUtils.pugToPublic('copy-view', 'src/pug/*.pug', ''),
      gulpUtils.copyToPublic('copy-bower', 'bower_components/*/**', 'bower_components'),
      gulpUtils.bundleJs('copy-js', ['src/js/utils.js', 'src/js/app/services/*.js', 'src/js/app/*.js'], 'app.js'),
      gulpUtils.pugToPublic('pug-styles', ['src/styles/*.pug', 'src/styles/**/*.pug'], 'styles'),
      gulpUtils.copyToPublic('copy-styles', ['src/styles/*.css', 'src/styles/**/*.css'], 'styles'),
      gulpUtils.copyToPublic('copy-images', ['src/images/*', 'src/images/**/*'], 'images'),
      gulpUtils.bundleJs('copy-js-download', ['src/js/utils.js', 'src/js/download/services/*.js', 'src/js/download/*.js'],
        'download_app.js'),
      gulpUtils.copyJs('copy-js-entry', 'src/js/entry.js')
    ]));
  }
};
