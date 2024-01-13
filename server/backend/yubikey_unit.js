'use strict';

const chai = require('chai');
chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const YubikeyBackend = require('./yubikey');

describe('yubikey backend module', () => {
  it('should export constructor', () => {
    YubikeyBackend.should.be.a('function');
  });
});
describe('yubikey backend object', () => {
  let yubikey;
  beforeEach(() => {
    const clientId = '29285';
    const secretId = '7bVWEcLCdQmEOmCEHPKl4wAY5Qk=';
    yubikey = new YubikeyBackend(clientId, secretId);
  });
  it('should have verify method', () => {
    yubikey.verify.should.be.a('function');
  });
  describe('verify method', () => {
    it('should resolve non-false', () => {
      yubikey._request = (params, callback) => callback(null, true);
      yubikey.verify('test').should.be.fulfilled;
    });
  });
});
