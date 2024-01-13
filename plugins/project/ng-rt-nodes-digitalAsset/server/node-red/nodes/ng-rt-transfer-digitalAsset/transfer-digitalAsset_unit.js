'use strict';

// var should = require("should");
var uiListenerNode = require("./transfer-digitalAsset");
var helper = require("node-red-node-test-helper");

describe('transfer-digitalAsset Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "transfer-digitalAsset",
      name: "transfer-digitalAsset"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'transfer-digitalAsset');
      done();
    });
  });
});
