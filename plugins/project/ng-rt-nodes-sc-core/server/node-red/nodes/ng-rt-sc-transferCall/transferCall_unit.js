'use strict';

var node = require('./transferCall');
var helper = require('node-red-node-test-helper');

describe('transferCall Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [
      {
        id: 'n1',
        type: 'transferCall',
        name: 'transferCall'
      }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      n1.should.have.property('name', 'transferCall');
      done();
    });
  });
});
