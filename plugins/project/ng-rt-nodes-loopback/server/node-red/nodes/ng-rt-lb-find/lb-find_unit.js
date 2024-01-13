'use strict';

// var should = require("should");
var uiListenerNode = require("./lb-find");
var helper = require("node-red-node-test-helper");

describe('lb-find Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "lb-find",
      name: "lb-find"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'lb-find');
      done();
    });
  });
});
