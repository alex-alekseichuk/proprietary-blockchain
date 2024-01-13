'use strict';

// var should = require("should");
var uiListenerNode = require("./lb-create");
var helper = require("node-red-node-test-helper");

describe('lb-create Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "lb-create",
      name: "lb-create"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'lb-create');
      done();
    });
  });
});
