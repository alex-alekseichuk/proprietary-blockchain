'use strict';

// var should = require("should");
var uiListenerNode = require("./userLogin");
var helper = require("node-red-node-test-helper");

describe('userLogin Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "userLogin",
      name: "userLogin"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'userLogin');
      done();
    });
  });
});
