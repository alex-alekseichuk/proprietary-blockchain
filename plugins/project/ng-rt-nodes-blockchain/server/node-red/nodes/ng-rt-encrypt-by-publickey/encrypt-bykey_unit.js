'use strict';

// var should = require("should");
var uiListenerNode = require("./encrypt-bykey");
var helper = require("node-red-node-test-helper");

describe('encrypt-by-publickey Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "encrypt-by-publickey",
      name: "encrypt-by-publickey"
    }];
    helper.load(uiListenerNode, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'encrypt-by-publickey');
      done();
    });
  });
});
