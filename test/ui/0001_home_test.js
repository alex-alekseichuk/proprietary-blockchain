/**
 * Login form tests.
 */
'use strict';
/* global document */

const ui = require('./nightmare');

describe('home page', () => {
  it('should have login form', done => {
    ui
      .open()
      .wait(2000)
      .evaluate(function() {
        return typeof document.querySelector('.window-login');
      })
      .end()
      .then(result => {
        ui.expect(result).to.be.equal('object');
        done();
      })
      .catch(done);
  });

  it('should login', done => {
    ui
      .loginAndCheckNodeExists('div.title-project')
      .then(result => {
        ui.expect(result).to.be.equal(true);
        done();
      })
      .catch(done);
  });

  it('should not login with incorrect credentials', done => {
    ui
      .loginAndGetNodeHtml('.paper-toast', ui.userName, 'incorrect.password')
      .then(result => {
        ui.expect(result).to.be.equal('Incorrect credentials');
        done();
      })
      .catch(done);
  });
});
