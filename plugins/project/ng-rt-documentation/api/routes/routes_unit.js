'use strict';

var routes = require('./routes');

describe('routes', () => {
  it("Should have property", function() {
    routes.should.have.property('init');
    routes.should.have.property('activate');
  });
});
