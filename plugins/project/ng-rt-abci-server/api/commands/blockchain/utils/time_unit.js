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

var time = require('./time');

describe('time tests', () => {
  it("convert timestamp ", done => {
    let timestamp = '1533097426';
    let timeStampMock = 'Wed, 01 Aug 2018 04:23:46 GMT';

    let timeFormat = time.convertTimeStampToUTC(timestamp);

    expect(timeStampMock).to.be.equal(timeFormat);
    done();
  });
});
