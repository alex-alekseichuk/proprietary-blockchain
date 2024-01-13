/**
 * PDF upload form UI tests.
 */
'use strict';

const ui = require('./nightmare');

describe('PDF upload form', () => {
  it('should open PDF upload form', done => {
    ui.loginGoToPageAndCheckExistsNode('ng-rt-menu-item[data-route=pdfUpload] a', 'paper-toolbar.pdf-upload', done);
  });
});
