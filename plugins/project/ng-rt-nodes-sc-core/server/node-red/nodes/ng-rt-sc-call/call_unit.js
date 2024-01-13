'use strict';

var node = require('./call');
var helper = require('node-red-node-test-helper');

describe('call Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [
      {
        id: 'n1',
        type: 'call',
        name: 'call'
      }
    ];
    helper.load(node, flow, function() {
      var n1 = helper.getNode('n1');
      n1.should.have.property('name', 'call');
      done();
    });
  });
});
