'use strict';

// var should = require("should");
var node = require("./store-file-in-storage-provider");
var helper = require("node-red-node-test-helper");

describe.skip('store-in-file-storage-provider_unit Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "store-in-file-storage-provider",
      name: "store-in-file-storage-provider"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'store-in-file-storage-provider');
      done();
    });
  });
});
