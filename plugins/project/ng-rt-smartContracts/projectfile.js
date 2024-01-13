'use strict';

module.exports = {
  gulpOptions: {
    vulcanize: {
      excludes: ['bs58.js', 'keys.js']
    },
    userguides: {
      includes: ['admin'],
      outputHtml: true,
      outputEpub: true,
      outputPdf: true
    }
  }
};
