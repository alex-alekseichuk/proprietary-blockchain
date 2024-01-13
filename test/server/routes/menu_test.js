'use strict';
require('chai').should();
const engineHelper = require('../engine/helper');

describe.skip('Menu', function() {
  var request;
  var User;
  var userData = require('../common/testUser');

  before(() => {
    return engineHelper.init()
      .then(() => {
        request = require('supertest-as-promised')(engineHelper.server);
        User = engineHelper.app.models.User;
      })
      .then(() => User.remove({}))
      .then(() => User.create(userData))
      ;
  });

  describe('/menu', function() {
    it('can not be accessed without login', () => {
      return request.get('/menu')
        .expect(401);
    });

    it('can be accessed after login', () => {
      return request.post('/auth/login')
        .send({
          username: userData.username,
          password: userData.password
        })
        .expect(200)
        .then(res => {
          res.body.should.have.property("token");
          var token = res.body.token;
          return request.get('/menu')
            .set('Authorization', 'JWT ' + token)
            .expect(200)
            .then(response => {
              // response.body;
            });
        });
    });

    it.skip('can not be accessed after logout', () => {
      return request.post('/auth/login')
        .send({
          username: userData.username,
          password: userData.password
        })
        .expect(302)
        .expect('Location', '/')
        .then(() => {
          return request.post('/auth/logout')
            .send()
            .expect(302)
            .expect('Location', '/')
            .then(() => {
              return request.get('/menu')
                .expect(401);
            });
        });
    });
  });
});
