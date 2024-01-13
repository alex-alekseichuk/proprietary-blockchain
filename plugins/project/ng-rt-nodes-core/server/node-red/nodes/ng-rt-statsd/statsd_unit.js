'use strict';

// var should = require("should");
var node = require("./statsd");
var helper = require("node-red-node-test-helper");

describe.skip('statsd_unit Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "statsd",
      name: "statsd"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'statsd');
      done();
    });
  });
});
