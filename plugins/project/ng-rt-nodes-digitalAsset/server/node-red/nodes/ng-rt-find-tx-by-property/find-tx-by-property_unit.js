'use strict';

// var should = require("should");
var uiListenerNode = require("./find-tx-by-property");
var helper = require("node-red-node-test-helper");

describe('find-tx-by-property Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "find-tx-by-property",
      name: "find-tx-by-property"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'find-tx-by-property');
      done();
    });
  });
});
