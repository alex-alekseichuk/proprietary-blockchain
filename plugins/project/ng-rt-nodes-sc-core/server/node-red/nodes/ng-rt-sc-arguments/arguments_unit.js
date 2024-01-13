'use strict';

// var should = require("should");
var node = require("./arguments");
var helper = require("node-red-node-test-helper");

describe('arguments Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "arguments",
      name: "arguments"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'arguments');
      done();
    });
  });
});
