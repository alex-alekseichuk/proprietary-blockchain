'use strict';

// var should = require("should");
var uiListenerNode = require("./get-asset-by-owner");
var helper = require("node-red-node-test-helper");

describe('get-asset-by-owner Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "get-asset-by-owner",
      name: "get-asset-by-owner"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'get-asset-by-owner');
      done();
    });
  });
});
