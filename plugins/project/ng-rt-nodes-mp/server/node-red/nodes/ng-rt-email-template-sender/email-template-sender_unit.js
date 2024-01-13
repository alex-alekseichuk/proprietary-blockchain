'use strict';

// var should = require("should");
var node = require("./email-template-sender");
var helper = require("node-red-node-test-helper");

describe('email-template-sender_unit Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "email-template-sender",
      name: "email-template-sender"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'email-template-sender');
      done();
    });
  });
});
