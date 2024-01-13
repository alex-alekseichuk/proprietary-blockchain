'use strict';

// var should = require("should");
var node = require("./each-item-end");
var helper = require("node-red-node-test-helper");

describe('each-item-end_unit Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "each-item-end",
      name: "each-item-end"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'each-item-end');
      done();
    });
  });
});
