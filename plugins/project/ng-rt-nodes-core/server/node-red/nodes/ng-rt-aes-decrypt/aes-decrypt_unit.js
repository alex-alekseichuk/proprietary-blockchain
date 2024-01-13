'use strict';

const chai = require('chai');
const common = require('../../../../test/unit/common');
const expect = chai.expect;
const aesDecryptModule = require('./aes-decrypt');

describe('Project core node-red AES decrypt', () => {
  it('decrypted value should equal init value', () => {
    aesDecryptModule(common.RED);

    let msg = common.utils.testMsg();
    msg.ctx.payload = common.utils.serviceManager.services.aes256.encryptBuffer(new Buffer(msg.ctx.payload.data));

    let decrypted = common.RED.emulate(msg);
    return expect(decrypted.ctx.payload.toString()).to.be.equal(common.utils.testMsg().ctx.payload.data);
  });
});
