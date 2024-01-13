'use strict';
const assert = require('chai').assert;
require('chai').should();
const engineHelper = require('../engine/helper');

// TODO: add tests for ubikey

describe.skip('Authentication', function() {
  var request;
  var User;
  before(() => {
    return engineHelper.init()
      .then(() => {
        request = require('supertest-as-promised')(engineHelper.server);
        User = engineHelper.app.models.User;
      });
  });

  var userData = require('../common/testUser');

  beforeEach(done => {
    User.remove({}, done);
  });

  describe('/', function() {
    it('should be redirected to /admin', () => {
      return request.get('/')
        .expect(302)
        .expect('Location', '/admin');
    });
  });

  describe('/auth/signup', () => {
    describe('for new user', () => {
      it('should signup new user', () => {
        return request.post('/auth/signup').send(userData)
          .expect(200)
          .then(res => {
            res.body.should.have.property("token");
            return User.findOne({where: {username: userData.username}}, (err, user) => {
              assert.ok(user);
              assert.equal(user.email, userData.email);
            });
          });
      });
    });

    describe('for existing user', () => {
      beforeEach(done => {
        User.create(userData, done);
      });
      it('should return 400 for the same email', () => {
        return request.post('/auth/signup').send({
          username: userData.username + 'changed',
          password: userData.password,
          email: userData.email
        })
          .expect(400);
      });
      it('should return 400 for the same username', () => {
        return request.post('/auth/signup').send({
          username: userData.username,
          password: userData.password,
          email: userData.email + 'changed'
        })
          .expect(400);
      });
    });
  });

  describe('/auth/login', () => {
    beforeEach(done => {
      User.create(userData, done);
    });

    it('can not sign in with non existing user', () => {
      return request.post('/auth/login')
        .send({
          username: userData.username + 'changed',
          password: userData.password + 'changed'
        })
        .expect(302)
        .expect('Location', '/auth/login-fail');
    });

    it('can sign in with existing user', () => {
      return request.post('/auth/login')
        .send({
          username: userData.username,
          password: userData.password
        })
        .expect(200)
        .then(res => {
          return res.body.should.have.property("token");
        });
    });
  });
});
