/**
 * Dashboard application UI tests.
 */
'use strict';

const ui = require('./nightmare');

describe('Dashboard application', () => {
  it('should open dashboard application', done => {
    ui.loginGoToPageAndCheckExistsNode(
      'ng-rt-menu-item[data-route=dashboard] a', 'paper-toolbar.ng-rt-dashboard', done);
  });
});
