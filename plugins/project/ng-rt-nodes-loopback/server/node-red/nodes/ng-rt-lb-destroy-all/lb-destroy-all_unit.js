'use strict';

// var should = require("should");
var uiListenerNode = require("./lb-destroy-all");
var helper = require("node-red-node-test-helper");

describe('lb-destroy-all Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "lb-destroy-all",
      name: "lb-destroy-all"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'lb-destroy-all');
      done();
    });
  });
});
