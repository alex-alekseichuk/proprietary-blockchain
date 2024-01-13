'use strict';

const chai = require('chai');
const common = require('../../../../test/unit/common');
const expect = chai.expect;
const aesEncryptModule = require('./aes-encrypt');

describe('Project core node-red AES encrypt', () => {
  it('init value should equal encrypted value', () => {
    aesEncryptModule(common.RED);

    let enc = common.RED.emulate(common.utils.testMsg());

    enc.ctx.payload = common.utils.serviceManager.services.aes256.decryptBuffer(new Buffer(enc.ctx.payload));

    return expect(enc.ctx.payload.toString()).to.be.equal(common.utils.testMsg().ctx.payload.data);
  });
});
