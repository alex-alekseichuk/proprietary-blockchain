'use strict';

// var should = require("should");
var uiListenerNode = require("./ui-listener");
var helper = require("node-red-node-test-helper");

describe('ui-listener Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "ui-listener",
      name: "ui-listener"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'ui-listener');
      done();
    });
  });
});
