'use strict';

const chai = require('chai');
const expect = chai.expect;
chai.should();

describe('services', function() {
  const services = require('./services');

  beforeEach(() => {
  });

  it('Is add a function', done => {
    expect(services.add).to.be.a('function');
    done();
  });

  it('Is get a function', done => {
    expect(services.get).to.be.a('function');
    done();
  });

  it('Is remove a function', done => {
    expect(services.remove).to.be.a('function');
    done();
  });

  it('Is addDirectly a function', done => {
    expect(services.addDirectly).to.be.a('function');
    done();
  });

  it('Is getOrCreate a function', done => {
    expect(services.getOrCreate).to.be.a('function');
    done();
  });

  it('Is list a function', done => {
    expect(services.list).to.be.a('function');
    done();
  });

  it('Is setDefault a function', done => {
    expect(services.setDefault).to.be.a('function');
    done();
  });

  it('Is listApiServices a function', done => {
    expect(services.listApiServices).to.be.a('function');
    done();
  });
});
