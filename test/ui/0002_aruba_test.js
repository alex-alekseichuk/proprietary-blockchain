/**
 * Aruba application UI tests.
 */
'use strict';

const ui = require('./nightmare');

describe('Auba Forms', () => {
  it('should open aruba request form', done => {
    ui.loginGoToPageAndCheckExistsNode(
      'ng-rt-menu-item[data-route=aruba-request-form] a', 'paper-toolbar.aruba-request-form', done);
  });

  it('should open aruba request view', done => {
    ui.loginGoToPageAndCheckExistsNode(
      'ng-rt-menu-item[data-route=aruba-request-view] a', 'paper-toolbar.aruba-request-view', done);
  });

  it('should open aruba visa view', done => {
    ui.loginGoToPageAndCheckExistsNode(
      'ng-rt-menu-item[data-route=aruba-visa-view] a', 'paper-toolbar.aruba-visa-view', done);
  });
});
