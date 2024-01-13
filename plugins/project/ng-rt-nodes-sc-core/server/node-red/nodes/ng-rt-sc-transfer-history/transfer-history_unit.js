'use strict';

// var should = require("should");
var node = require("./transfer-history");
var helper = require("node-red-node-test-helper");

describe('create-model-instance Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "transfer-history",
      name: "transfer-history"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'transfer-history');
      done();
    });
  });
});
