'use strict';

// var should = require("should");
var uiListenerNode = require("./get-transaction");
var helper = require("node-red-node-test-helper");

describe('get-transaction Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "get-transaction",
      name: "get-transaction"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'get-transaction');
      done();
    });
  });
});
