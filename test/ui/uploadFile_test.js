/**
 * Upload File UI tests.
 */
'use strict';

const ui = require('./nightmare');

describe('Upload File', () => {
  it('should open Upload File page', done => {
    ui.loginGoToPageAndCheckExistsNode(
      'ng-rt-menu-item[data-route=documents] a', 'paper-toolbar.ng-app-documents', done);
  });
});
