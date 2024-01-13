'use strict';

// var should = require("should");
var node = require("./smartContract-marker");
var helper = require("node-red-node-test-helper");

describe('project-sc-1.0 Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "project-sc-1.0",
      name: "project-sc-1.0"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'project-sc-1.0');
      done();
    });
  });
});
