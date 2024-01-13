'use strict';

// var should = require("should");
var node = require("./get-memory-field");
var helper = require("node-red-node-test-helper");

describe('create-model-instance Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "get-memory-field",
      name: "get-memory-field"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'get-memory-field');
      done();
    });
  });
});
