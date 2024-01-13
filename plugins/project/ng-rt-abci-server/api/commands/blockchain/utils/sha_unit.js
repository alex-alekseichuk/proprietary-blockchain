// /**
//  * Test sha.js
//  */
'use strict';

const sinonChai = require("sinon-chai");
const chai = require('chai');
chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;

var hash = require('./sha');

describe('create a SHA256 Hash object', () => {
  it("create SHA256 object ", done => {
    let sha256 = hash.createHash();
    expect(sha256).not.to.be.NaN;
    done();
  });

  it("update SHA256 object ", done => {
    let sha256 = hash.createHash();
    sha256 = hash.updateHash(sha256, 'Test');
    expect(sha256).not.to.be.NaN;
    done();
  });

  it("finalize SHA256 object ", done => {
    let sha256 = hash.createHash();
    sha256 = hash.updateHash(sha256, 'aNewHash');
    sha256 = hash.finalizeHash(sha256);
    expect(sha256).not.to.be.NaN;

    done();
  });

  // final test - if this one is okay the other two are ok as well ....
  it("get SHA256 final string value", done => {
    let sha256 = hash.createHash();
    sha256 = hash.updateHash(sha256, 'aNewHash');
    sha256 = hash.finalizeHash(sha256);

    let appHashMock = '0ed131bc727ba6071aa781daadf4ab2a89ee276bda6506a7a8351816d723197f';
    let appHash = hash.getHash(sha256);

    expect(appHashMock).to.be.equal(appHash);
    done();
  });
});
