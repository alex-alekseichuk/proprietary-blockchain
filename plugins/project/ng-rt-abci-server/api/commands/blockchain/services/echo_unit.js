// 'use strict';

// const chai = require('chai');
// const sinon = require('sinon');
// const expect = chai.expect;
// chai.should();

// const testData = require('../../../../test/testData.js');
// describe('test', function() {
//   const echo1 = require('./echo');
//   var spy1 ;
//   var stub;
//   beforeEach(() => {
//     spy1 = sinon.spy(echo1,'echo');
//   //stub = sinon.stub(echo1,'echo');
//     //spy1.resetHistory();
//   });

//   afterEach(() => {
//     //stub.restore();
//     spy1.restore();
//   });

//   it('Is function echo called once - false ', done => {
//     spy1.called.should.be.false;
//     done();
//   });

//   it('Is function echo called once - true ', done => {
//    echo1.echo(testData.mockService, testData.stubRequest);
//     // TODO This check should be true
//     spy1.called.should.be.true;
//     done();
//   });

//   it('Is function called with correct arguments ', done => {
//   echo1.echo(testData.mockService, testData.stubRequest);
//   spy1.withArgs(testData.mockService, testData.stubRequest).calledOnce;
//   done();
//   });

//   it('Is function returned correct object', done => {
//     echo1.echo(testData.mockService, testData.stubRequest);
//     spy1.alwaysReturned({
//       code: 0,
//       log: 'Echo executed'
//     });
//     done();
//     });
// });

'use strict';

const chai = require('chai');
const sinon = require('sinon');
chai.should();

const testData = require('../../../../test/testData.js');
const expect = chai.expect;

describe('test', function() {
  const echo1 = require('./echo');
  var spy1 = sinon.spy(echo1);

  beforeEach(() => {
    spy1.resetHistory();
  });

  it('Is function echo called once - false ', () => {
    spy1.called.should.be.false;
  });

  it('Is function echo called once - true ', () => {
    spy1(testData.mockService, testData.stubRequest);
    spy1.called.should.be.true;
  });

  it('Is function return ', () => {
    let response = spy1(testData.mockService, testData.stubRequest);
    expect(response).to.have.property('code').to.eql(0);
    expect(response).to.have.property('log').to.eql('Echo executed');
  });
});
