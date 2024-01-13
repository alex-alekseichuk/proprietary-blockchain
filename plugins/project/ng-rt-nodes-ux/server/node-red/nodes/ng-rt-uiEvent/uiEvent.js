'use strict';
/**
 * Copyright 2013, 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

/* eslint-disable complexity */

module.exports = function(RED) {
  var operators = {
    eq: (a, b) => a === b,
    neq: (a, b) => a !== b,
    lt: (a, b) => a < b,
    lte: (a, b) => a <= b,
    gt: (a, b) => a > b,
    gte: (a, b) => a >= b,
    btwn: (a, b, c) => a >= b && a <= c,
    cont: (a, b) => (String(a)).indexOf(b) !== -1,
    regex: (a, b, c, d) => (String(a)).match(new RegExp(b, d ? 'i' : '')),
    true: a => a === true,
    false: a => a === false,
    null: a => (typeof a === "undefined" || a === null),
    nnull: a => (typeof a !== "undefined" && a !== null),
    else: a => a === true
  };

  /**
   *
   * @param {*} n node
   */
  function uiEventNode(n) {
    RED.nodes.createNode(this, n);
    this.rules = n.rules || [];
    this.property = n.property;
    this.propertyType = n.propertyType || "msg";
    this.checkall = n.checkall || "true";
    this.previousValue = null;
    var node = this;
    for (var i = 0; i < this.rules.length; i += 1) {
      var rule = this.rules[i];
      if (!rule.vt) {
        if (isNaN(Number(rule.v))) {
          rule.vt = 'str';
        } else {
          rule.vt = 'num';
        }
      }
      if (rule.vt === 'num') {
        if (!isNaN(Number(rule.v))) {
          rule.v = Number(rule.v);
        }
      }
      if (typeof rule.v2 !== 'undefined') {
        if (!rule.v2t) {
          if (isNaN(Number(rule.v2))) {
            rule.v2t = 'str';
          } else {
            rule.v2t = 'num';
          }
        }
        if (rule.v2t === 'num') {
          rule.v2 = Number(rule.v2);
        }
      }
    }

    this.on('input', function(msg) {
      var onward = [];
      try {
        var prop = RED.util.evaluateNodeProperty(node.property, node.propertyType, node, msg);
        var elseflag = true;
        for (var i = 0; i < node.rules.length; i += 1) {
          var rule = node.rules[i];
          var test = prop;
          var v1;
          var v2;
          if (rule.vt === 'prev') {
            v1 = node.previousValue;
          } else {
            v1 = RED.util.evaluateNodeProperty(rule.v, rule.vt, node, msg);
          }
          v2 = rule.v2;
          if (rule.v2t === 'prev') {
            v2 = node.previousValue;
          } else if (typeof v2 !== 'undefined') {
            v2 = RED.util.evaluateNodeProperty(rule.v2, rule.v2t, node, msg);
          }
          if (rule.t == "else") {
            test = elseflag;
            elseflag = true;
          }
          if (operators[rule.t](test, v1, v2, rule.case)) {
            onward.push(msg);
            elseflag = false;
            if (node.checkall == "false") {
              break;
            }
          } else {
            onward.push(null);
          }
        }
        node.previousValue = prop;
        this.send(onward);
      } catch (err) {
        node.warn(err);
      }
    });
  }
  RED.nodes.registerType("uiEvent", uiEventNode);
};
