'use strict';

// var should = require("should");
var node = require("./offchain-storage");
var helper = require("node-red-node-test-helper");

describe('create-model-instance Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "offchain-storage",
      name: "offchain-storage"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'offchain-storage');
      done();
    });
  });
});
