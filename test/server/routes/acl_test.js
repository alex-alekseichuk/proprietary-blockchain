'use strict';
require('chai').should();
const engineHelper = require('../engine/helper');

describe.skip('ACL Check', function() {
  var request;
  before(() => {
    return engineHelper.init()
      .then(() => {
        request = require('supertest-as-promised')(engineHelper.server);
      });
  });

  describe('/', function() {
    it('should be back status "authorization Required"', () => {
      return request.get('/api/v2/Accesses')
        .expect(401);
    });
  });
});
