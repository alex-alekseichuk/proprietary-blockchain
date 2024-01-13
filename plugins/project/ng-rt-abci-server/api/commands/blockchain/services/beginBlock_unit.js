/* *
 * Test abci transaction
 */
'use strict';

const sinonChai = require("sinon-chai");
const chai = require('chai');
chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(sinonChai);
const testData = require('../../../../test/testData.js');
const beginBlock = require('./beginBlock');

describe('abci backend', () => {
  it("begin block", function() {
    let jsonResponse = beginBlock(testData.services, testData.tnBlockDataInitChain);
    jsonResponse.should.have.property('block');
    jsonResponse.should.have.property('tmLatestBlock');
    jsonResponse.should.have.property('tmLatestBlock');
  });
});
