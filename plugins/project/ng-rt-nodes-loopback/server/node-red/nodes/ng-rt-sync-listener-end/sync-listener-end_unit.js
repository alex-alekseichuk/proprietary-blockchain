'use strict';

// var should = require("should");
var uiListenerNode = require("./sync-listener-end");
var helper = require("node-red-node-test-helper");

describe('sync-listener-end Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "sync-listener-end",
      name: "sync-listener-end"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'sync-listener-end');
      done();
    });
  });
});
