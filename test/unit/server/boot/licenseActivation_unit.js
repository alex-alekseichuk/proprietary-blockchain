'use strict';

const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
const request = require('request');
const licpage = require("../../../../server/licenseActivationClient.js");
var nock = require('nock');
var save;
var data =
  {
    activated: true,
    txID: "f2913f7f37a9d8be7eda07e9b9d0c4969a7cca9a476842eeb8b5ce1f8d4dc",
    signature: "dgCtTetxeysAc7VUeEN4TAxLxxyWdBJimU52DafzF9qo3MGTQXsaZ9FumjjqSRgGghfA6ymkamQRynSRBvg",
    timestamp: 1529495479917
  };
const base = 'http://license.project.com/license-manager/activate';

beforeEach(function() {
  save = sinon.stub(licpage, "signatureVerification");
});

afterEach(function() {
  save.restore();
});

describe(`In server/boot/licenseActivation_unit.js:`, () => {
  describe('Http POST request for Lic Activation', () => {
    nock('http://license.project.com')
            .post('/license-manager/activate', {serialNo: '123'})
            .reply(200, {
              activated: true,
              txID: "f2913f7f37a9d8be7eda07e9b9d0c4969a7cca9a476842eeb8b5ce1f8d4dc",
              signature: "dgCtTetxeysAc7VUeEN4TAxLxxyWdBJimU52DafzF9qo3MGTQXsaZ9FumjjqSRgGghfA6ymkamQRynSRBvg",
              timestamp: 1529495479917
            });

    it('should return false for invalid serial number', done => {
      const options = {
        method: 'post',
        json: {serialNo: '123'},
        url: `${base}`
      };
      request(options, (err, res, body) => {
        expect(res.statusCode).to.equal(200);
        expect(body.signature).to.equal(data.signature);
        expect(body.activated).to.equal(data.activated);
        expect(body.txID).to.equal(data.txID);
        done();
      });
    });
  });

  describe('Stubbing signature verification', () => {
    it('signature verification returns true', done => {
      save.withArgs(data).returns(true);
      licpage.signatureVerification(data).should.be.true;
      done();
    });

    it('signature verification returns false', done => {
      save.withArgs(data).returns(false);
      licpage.signatureVerification(data).should.be.false;
      done();
    });
  });
});
