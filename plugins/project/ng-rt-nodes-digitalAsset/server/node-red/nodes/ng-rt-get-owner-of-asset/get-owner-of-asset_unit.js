'use strict';

// var should = require("should");
var uiListenerNode = require("./get-owner-of-asset");
var helper = require("node-red-node-test-helper");

describe('get-owner-of-asset Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "get-owner-of-asset",
      name: "get-owner-of-asset"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'get-owner-of-asset');
      done();
    });
  });
});
