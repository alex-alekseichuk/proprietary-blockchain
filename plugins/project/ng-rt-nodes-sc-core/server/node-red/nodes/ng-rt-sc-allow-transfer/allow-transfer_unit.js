'use strict';

// var should = require("should");
var node = require("./allow-transfer");
var helper = require("node-red-node-test-helper");

describe('allow-transfer Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "allow-transfer",
      name: "allow-transfer"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'allow-transfer');
      done();
    });
  });
});
