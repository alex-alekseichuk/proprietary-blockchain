'use strict';

module.exports = {
  gulpOptions: {
    vulcanize: {
      excludes: ['bs58.js', 'keys.js', 'jsoneditor.min.js', 'json-patch-duplex.js', '^\\/custom\\/']
    },
    userguides: {
      includes: ['admin', 'enduser'],
      outputHtml: true,
      outputEpub: true,
      outputPdf: true
    },
    babelProcessVulkanizedFiles: true,
    babelProcessFiles: ['js/explorer.js', 'js/bowser.js',
      'redux/actions/auxil/action_types.js', 'redux/actions/actions_log_viewer.js', 'redux/client.js', 'js/main.js',
      'redux/reducers/reducer_log_viewer.js', 'redux/reducers/reducers.js']
  },

  defineCustomGulpTasks(gulp, options, gulpUtils) {
    gulp.task('customBuildClient', gulp.parallel([
      gulpUtils.copyToPublic('copy-res-jsoneditor', 'bower_components/jsoneditor/dist/**/*', 'jsoneditor/dist'),
      gulpUtils.copyToPublic('copy-pages', [
        'src/elements/state-machine-v01/ng-rt-attach-sc.html',
        'src/elements/empty_layout.html'
      ], '')
    ]));
  }
};
