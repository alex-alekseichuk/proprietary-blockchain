'use strict';
const chai = require('chai');
chai.should();

describe('exitHandler', function() {
  
  let exitHandler;
  before(() => {
    exitHandler = require('../../server/exitHandler')(true);
  });

  it('catch SIGINT', done => {
    exitHandler(done);
    process.kill(process.pid, 'SIGINT');
  });

  it('catch SIGUSR1', done => {
    exitHandler(done);
    process.kill(process.pid, 'SIGUSR1');
  });

  it('catch SIGUSR2', done => {
    exitHandler(done);
    process.kill(process.pid, 'SIGUSR2');
  });

  it('catch uncaught exceeption', done => {
    exitHandler(done);
    process.nextTick(() => {
      throw new Error("Test exception");
    });
  });
});