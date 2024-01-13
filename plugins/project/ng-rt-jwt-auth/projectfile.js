'use strict';

module.exports = {
  gulpOptions: {
    vulcanize: {
      excludes: ['bs58.js', 'keys.js', 'jsoneditor.min.js', 'json-patch-duplex.js']
    }
  },
  defineCustomGulpTasks(gulp, options, gulpUtils) {
  }
};
