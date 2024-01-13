'use strict';

// var should = require("should");
var node = require("./caller-pubkey");
var helper = require("node-red-node-test-helper");

describe('caller-pubkey Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "caller-pubkey",
      name: "caller-pubkey"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'caller-pubkey');
      done();
    });
  });
});
