'use strict';

// var should = require("should");
var uiListenerNode = require("./get-asset-history");
var helper = require("node-red-node-test-helper");

describe('get-asset-history Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "get-asset-history",
      name: "get-asset-history"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'get-asset-history');
      done();
    });
  });
});
