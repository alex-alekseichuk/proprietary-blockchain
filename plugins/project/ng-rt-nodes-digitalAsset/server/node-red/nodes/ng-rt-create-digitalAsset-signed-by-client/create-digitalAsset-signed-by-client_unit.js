'use strict';

// var should = require("should");
var uiListenerNode = require("./create-digitalAsset-signed-by-client");
var helper = require("node-red-node-test-helper");

describe('create-digitalAsset-signed-by-client Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "create-digitalAsset-signed-by-client",
      name: "create-digitalAsset-signed-by-client"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'create-digitalAsset-signed-by-client');
      done();
    });
  });
});
