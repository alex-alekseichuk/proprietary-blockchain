'use strict';

// var should = require("should");
var node = require("./get-transfer-info");
var helper = require("node-red-node-test-helper");

describe('create-model-instance Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "get-transfer-info",
      name: "get-transfer-info"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'get-transfer-info');
      done();
    });
  });
});
