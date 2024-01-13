'use strict';

var node = require('./publish');
var helper = require('node-red-node-test-helper');

describe('publish Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [
      {
        id: 'n1',
        type: 'publish',
        name: 'publish'
      }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      n1.should.have.property('name', 'publish');
      done();
    });
  });
});
