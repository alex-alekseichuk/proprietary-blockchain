'use strict';

// var should = require("should");
var uiListenerNode = require("./create-digitalAsset");
var helper = require("node-red-node-test-helper");

describe('create-digitalAsset Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "create-digitalAsset",
      name: "create-digitalAsset"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'create-digitalAsset');
      done();
    });
  });
});
