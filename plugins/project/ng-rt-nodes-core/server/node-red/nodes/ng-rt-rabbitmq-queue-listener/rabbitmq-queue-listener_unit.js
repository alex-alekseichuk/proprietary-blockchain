'use strict';

// var should = require("should");
var node = require("./rabbitmq-queue-listener");
var helper = require("node-red-node-test-helper");

describe.skip('rabbitmq-queue-listener_unit Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "rabbitmq-queue-listener",
      name: "rabbitmq-queue-listener"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'rabbitmq-queue-listener');
      done();
    });
  });
});
