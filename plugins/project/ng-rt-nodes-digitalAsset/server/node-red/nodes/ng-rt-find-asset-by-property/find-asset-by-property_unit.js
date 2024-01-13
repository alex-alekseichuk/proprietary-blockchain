'use strict';

// var should = require("should");
var uiListenerNode = require("./find-asset-by-property");
var helper = require("node-red-node-test-helper");

describe('find-asset-by-property Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "find-asset-by-property",
      name: "find-asset-by-property"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'find-asset-by-property');
      done();
    });
  });
});
