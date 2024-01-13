'use strict';
/* global document */

const argv = require('minimist')(process.argv.slice(2));

const targets = {
  local: 'http://localhost:8443',
  dev: 'https://dev.project.com',
  24: 'http://10.0.50.24:8443'
};

const URI = argv.uri || targets[argv.t] || targets[argv.target] || targets.local;

const Nightmare = require('nightmare');

const chai = require('chai');

const ui = {
  WAIT: 2000,
  PERTEST_TIMEOUT: 120000,

  userName: 'user1',
  userPassword: 'project.design',

  expect: chai.expect,

  open: () => {
    this.nightmare = new Nightmare({show: true, waitTimeout: 120000});
    this.nightmare.goto(URI);
    return this.nightmare;
  },

  login: (userName, userPassword) =>
    ui
      .open()
      .wait(1000)
      .type('input[name=username]', userName || ui.userName)
      .type('input[name=password]', userPassword || ui.userPassword)
      .click('#buttonlogin')
      .wait(1000)
      .wait(() => {
        const acceptBUtton = document.getElementById('acceptTermsButton');
        if (acceptBUtton) { // if Accept Terms and Conditions page
          acceptBUtton.click();
        }
        return true;
      })
      .wait(2000),

  loginAndCheckNodeExists: (selector, userName, userPassword) =>
    ui
      .login(userName, userPassword)
      .evaluate(function(selector) {
        return typeof document.querySelector(selector) === 'object';
      }, selector)
      .end(),

  loginAndGetNodeHtml: (selector, userName, userPassword) =>
    ui
      .login(userName, userPassword)
      .evaluate(function(selector) {
        return (document.querySelector(selector) || {innerHTML: null}).innerHTML || null;
      }, selector)
      .end(),

  loginGoToPageAndCheckExistsNode: (clickSelector, checkSelector, done) =>
    ui
      .login()
      .click(clickSelector)
      .wait(2000)
      .evaluate(function(selector) {
        return typeof document.querySelector(selector) === 'object';
      }, checkSelector)
      .end()
      .then(result => {
        ui.expect(result).to.be.equal(true);
        done();
      })
      .catch(done)
};

module.exports = ui;
