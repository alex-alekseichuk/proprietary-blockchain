'use strict';

// var should = require("should");
var node = require("./get-mailtemplate");
var helper = require("node-red-node-test-helper");

describe('get-mailtemplate_unit Node', function() {
  afterEach(function() {
    helper.unload();
  });

  it('should be loaded', function(done) {
    var flow = [{
      id: "n1",
      type: "get-mailtemplate",
      name: "get-mailtemplate"
    }];
    helper.load(node, flow, function() {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'get-mailtemplate');
      done();
    });
  });
});
