'use strict';

// var should = require("should");
var node = require("./escrow-asset-transfer");
var helper = require("node-red-node-test-helper");

describe('escrow-asset-transfer Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "escrow-asset-transfer",
      name: "escrow-asset-transfer"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'escrow-asset-transfer');
      done();
    });
  });
});
