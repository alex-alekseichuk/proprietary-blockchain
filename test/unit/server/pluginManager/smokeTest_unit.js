'use strict';

const PluginSmokeTest = require('../../../../pluginManager/PluginSmokeTest');
const helper = require('./helper')({}, [], {});
var should = require('chai').should();
const values = require('./data/testValues.json');

describe('SmokeTest', () => {
  let successTest;
  let failTest;
  let failTestWOptions;
  let failTestContainer = [];
  let failTestWOptionsContainer = [];

  before(() => {
    successTest = new PluginSmokeTest(helper.pluginInstance, { file: './data/smokeTestSuccess.js' }, helper.services);
    failTest = new PluginSmokeTest(helper.pluginInstance, { file: './data/smokeTestFail.js' }, helper.services);
    failTestWOptions = new PluginSmokeTest(helper.pluginInstance,
      {
        file: './data/smokeTestFail.js',
        testOptions: { FAIL_TEST_VALUE2: values.FAIL_TEST_VALUE2 }
      }, helper.services);
  });

  it('smoke test should be success', done => {
    let container = [];
    successTest.execute(container).then(() => {
      should.equal(container.length, 0);
      done();
    });
  });

  it('smoke test should be fail', () => {
    return failTest.execute(failTestContainer).then(() => {
      should.equal(failTestContainer.length, 1);
    });
  });

  it('smoke test message should be equal test value', () => {
    should.equal(failTestContainer[0], values.FAIL_TEST_VALUE);
  });

  it('smoke test with options value should be equal', () => {
    return failTestWOptions.execute(failTestWOptionsContainer).then(() => {
      should.equal(failTestWOptionsContainer.length, 1);
      should.equal(failTestWOptionsContainer[0], values.FAIL_TEST_VALUE2);
    });
  });
});
