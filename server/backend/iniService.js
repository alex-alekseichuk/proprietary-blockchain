'use strict';
const fs = require('fs');
const toml = require('toml');
const config = toml.parse(fs.readFileSync('./ini.toml', 'utf-8'));
/**
 * @param {*} value keypair i.e.'group:key'
 * @return {*} config return the value of the key pair. if not found it returns 'n.a'
 */
function get(value) {
  /* eslint-disable no-negated-condition */
  if (typeof value !== 'undefined') {
    var fields = value.split(':');
    var group = fields[0];
    var key = fields[1];
    try {
      return config[group][key];
    } catch (error) {
      return "n.a";
    }
  } else {
    return "empty parameter";
  }
}
module.exports = {
  get
};
