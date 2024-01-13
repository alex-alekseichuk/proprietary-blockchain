/**
 * Document sharing UI tests.
 */
'use strict';

const ui = require('./nightmare');

describe('Document sharing application', () => {
  it('should open document sharing', done => {
    ui.loginGoToPageAndCheckExistsNode(
      'ng-rt-menu-item[data-route=documentsSharing] a', 'paper-toolbar.ng-app-documentssharing', done);
  });
});
