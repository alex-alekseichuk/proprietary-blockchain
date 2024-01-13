'use strict';

const chai = require('chai');
const common = require('../../../../test/unit/common');
const expect = chai.expect;
const byemailKeyModule = require('./byemail-key');

describe('Project core node-red AES byemail key', () => {
  it('Founded key should equal test key', () => {
    byemailKeyModule(common.RED);

    let msg = common.utils.testMsg();
    msg.useremailtogetkey = 'test@project.com';

    msg = common.RED.emulate(msg);

    return expect(msg.ctx.pubkey).to.be.equal(common.utils.testMsg().ctx.key);
  });
});
