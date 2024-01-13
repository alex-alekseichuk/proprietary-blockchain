'use strict';

const chai = require('chai');
chai.should();

const engineHelper = require('./helper');

describe('engine', function() {
  var request;
  before(() => {
    return engineHelper.init()
      .then(() => {
        request = require('supertest')(engineHelper.server);
      });
  });

  it('should reply on GET /ng-rt-core/version', () => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    return request.get('/ng-rt-core/version')
      .expect(200)
      .then(response => response.should.be.ok);
  });

  it('should reply on GET /ng-rt-core/services', () => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    return request.get('/ng-rt-core/services')
      .expect(200)
      .then(response => response.should.be.ok);
  });

  it('should reply on GET /ng-rt-core/routes', () => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    return request.get('/ng-rt-core/routes')
      .expect(200)
      .then(response => response.should.be.ok);
  });

  it('should reply on GET /ng-rt-core/users-online', () => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    return request.get('/ng-rt-core/users-online')
      .expect(200)
      .then(response => response.should.be.ok);
  });
});
