'use strict';

// var should = require("should");
var uiListenerNode = require("./tendermint-response");
var helper = require("node-red-node-test-helper");

describe('tendermint-response Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "tendermint-response",
      name: "tendermint-response"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'tendermint-response');
      done();
    });
  });
});
