/**
 * Transaction application UI tests.
 */
'use strict';

const ui = require('./nightmare');

describe('Transaction application', () => {
  it('should open create tx form', done => {
    ui.loginGoToPageAndCheckExistsNode(
      'ng-rt-menu-item[data-route=ng-demo-transaction] a', 'paper-toolbar.ngrt-add-transaction', done);
  });
});
