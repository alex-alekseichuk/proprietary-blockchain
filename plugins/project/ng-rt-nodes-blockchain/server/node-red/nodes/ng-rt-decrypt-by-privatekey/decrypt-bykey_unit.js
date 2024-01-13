'use strict';

// var should = require("should");
var uiListenerNode = require("./decrypt-bykey");
var helper = require("node-red-node-test-helper");

describe('decrypt-by-privatekey Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "decrypt-by-privatekey",
      name: "decrypt-by-privatekey"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'decrypt-by-privatekey');
      done();
    });
  });
});
