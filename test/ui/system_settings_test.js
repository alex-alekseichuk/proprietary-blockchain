'use strict';
/* global document */

const fs = require('fs');
const path = require('path');
const ui = require('./nightmare');
const chai = require('chai');
const expect = chai.expect;

const TEST_TIMEOUT = 120000;

const getLogLevel = () => JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../config/server/log4js.json'), 'utf8')
).levels['[all]'];

describe('System settings page', () => {
  let logLevel;

  beforeEach(() => {
    logLevel = getLogLevel();
  });

  it('should have Log level dropdown that is equal to log level in log4js.json file', done => {
    ui
      .login('sysadmin')
      .wait('a[href="systemsettings"]')
      .click('a[href="systemsettings"]')
      .wait('vaadin-combo-box[label="Log level"]')
      .evaluate(() => document.querySelector('vaadin-combo-box[label="Log level"]').value)
      .end()
      .then(value => {
        expect(value).to.be.equal(logLevel);
        done();
      })
      .catch(done);
  }).timeout(TEST_TIMEOUT);

  it('should change log level in log4js.json file if select different log level in dropdown', done => {
    const newLogLevel = logLevel === 'trace' ? 'debug' : 'trace';

    ui
      .login('sysadmin')
      .wait('a[href="systemsettings"]')
      .click('a[href="systemsettings"]')
      .wait('vaadin-combo-box[label="Log level"]')
      .select('vaadin-combo-box[label="Log level"]', newLogLevel)
      .click('paper-button.ng-rt-system-settings') // click on Save settings button
      .wait(1000)
      .end()
      .then(() => {
        const logLevel = getLogLevel();
        expect(logLevel).to.be.equal(newLogLevel);
        done();
      })
      .catch(done);
  }).timeout(TEST_TIMEOUT);
});
