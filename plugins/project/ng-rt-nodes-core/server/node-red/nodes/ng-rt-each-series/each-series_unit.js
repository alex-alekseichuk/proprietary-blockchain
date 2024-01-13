'use strict';

// var should = require("should");
var node = require("./each-series");
var helper = require("node-red-node-test-helper");

describe('each-series_unit Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "each-series",
      name: "each-series"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'each-series');
      done();
    });
  });
});
