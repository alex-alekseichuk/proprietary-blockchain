'use strict';
const path = require('path');
global.appBase = global.appBase || path.resolve(__dirname, '../../../..');
const rethink = require(path.join(global.appBase, 'server/backend/rethinkdb'));
const engine = require('../../engine/helper');
const userData = require('../../common/testUser');
var user;
describe.skip('/document', function() {
  var app;
  before(() => {
    return engine.init()
      .then(() => {
        app = engine.app;
        return rethink.connect();
      })
      .then(() => {
        rethink.remove();
      });
  });

  var request = require('supertest');

  beforeEach(function(done) {
    user = request.agent(app);
    user
      .post('/auth/login')
      .send({
        username: userData.username,
        password: userData.password
      })
      .expect(302)
      .expect('Location', '/admin')
      .end((err, resp) => {
        done();
      });
  });

  it('GET /documents/ng-app-documents.html', function(done) {
    user
      .get('/documents/ng-app-documents.html')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });
});
