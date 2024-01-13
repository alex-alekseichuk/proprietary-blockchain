'use strict';

// var should = require("should");
var uiListenerNode = require("./txContext");
var helper = require("node-red-node-test-helper");

describe('txContext Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "txContext",
      name: "txContext"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'txContext');
      done();
    });
  });
});
