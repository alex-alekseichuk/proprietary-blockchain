'use strict';

// var should = require("should");
var node = require("./http-request");
var helper = require("node-red-node-test-helper");

describe('http-request_unit Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "http-request",
      name: "http-request"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'http-request');
      done();
    });
  });
});
