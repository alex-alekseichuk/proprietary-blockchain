'use strict';

const chai = require('chai');
const nodeRedCheckTx = require('./nodeRedCheckTx');
var fs = require('fs');
var path = require('path');
chai.should();
const expect = chai.expect;

const testData = require('../../../../test/testData.js');

describe('nodeRedCheckTx ', function() {
  it("if nodeRedFile exists", function() {
    let ifNodeFile = fs.existsSync(path.join(__dirname, "./../../../nodeRed/checkTxHook.json"));
    expect(ifNodeFile).to.be.eql(true);
  });

  it('Is function exists', function() {
    expect(nodeRedCheckTx).to.have.property('nodeRedCheck');
  });

  it('Is function called - true ', async () => {
    await nodeRedCheckTx.nodeRedCheck(testData.services, testData.transaction, {
      code: 0,
      log: 'OK'
    });
  });
});
