'use strict';

// var should = require("should");
var node = require("./contract-address");
var helper = require("node-red-node-test-helper");

describe('create-model-instance Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "contract-address",
      name: "contract-address"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'contract-address');
      done();
    });
  });
});
