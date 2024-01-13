// /**
//  * Test json.js
//  */
'use strict';

const sinonChai = require("sinon-chai");
const chai = require('chai');
chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = chai.expect;

let data = require('./json.js');

describe('JSON tests', () => {
  it("{} - true ", done => {
    expect(data.isJson('{}')).be.true;
    done();
  });

  it("[] - false ", done => {
    expect(data.isJson('[]')).be.false;
    done();
  });

  it(" '' - false ", done => {
    expect(data.isJson('')).be.false;
    done();
  });

  it("2134 - false ", done => {
    expect(data.isJson('2134')).be.false;
    done();
  });

  it("{ 'Id': 1, 'Name': 'Coke' } - true ", done => {
    expect(data.isJson('{ "Id": 1, "Name": "Coke" }')).be.true;
    done();
  });
});
