'use strict';

// var should = require("should");
var uiListenerNode = require("./create-assetDefinition");
var helper = require("node-red-node-test-helper");

describe('create-assetDefinition Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "create-assetDefinition",
      name: "create-assetDefinition"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'create-assetDefinition');
      done();
    });
  });
});
