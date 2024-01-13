'use strict';

// var should = require("should");
var uiListenerNode = require("./appLogin");
var helper = require("node-red-node-test-helper");

describe('appLogin Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "appLogin",
      name: "appLogin"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'appLogin');
      done();
    });
  });
});
