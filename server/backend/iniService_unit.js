// /**
//  * Test iniService.js
//  */
'use strict';

const sinonChai = require("sinon-chai");
const chai = require('chai');
chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(sinonChai);

const iniService = require('./iniService');

describe('iniService TOML', () => {
  it("get with invalid parameters - eq n.a.", done => {
    let result = iniService.get();
    result.should.be.equal('empty parameter');
    done();
  });

  it("get with valid parameters but wrong key pair - eq n.a.", done => {
    let result = iniService.get('test:test');
    result.should.be.equal('n.a');
    done();
  });

  it("get with valid parameters and right key pair", done => {
    let result = iniService.get('license:fileName');
    result.should.be.equal('ng-rt-core.lic');
    done();
  });
});
