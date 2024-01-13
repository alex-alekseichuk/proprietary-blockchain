'use strict';

module.exports = {
  defineCustomGulpTasks(gulp, options, gulpUtils) {
    gulp.task('customBuildClient', gulp.series([
      gulpUtils.pugToPublic('pugViews', 'src/pug/*.pug', ''),
      gulpUtils.copyToPublic('copyBowerComponents', 'bower_components/**/*', 'bower_components'),
      gulpUtils.bundleJs('bundleApp', 'src/js/app.js', 'app.js'),
      gulpUtils.pugToPublic('pugStyles', ['src/styles/*.pug', 'src/styles/**/*.pug'], 'styles'),
      gulpUtils.copyToPublic('copyCss', ['src/styles/*.css', 'src/styles/**/*.css'], 'styles')
    ]));
  }
};
