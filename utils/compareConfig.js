'use strict';

const _ = require('lodash');
const path = require('path');
const config = path.join(__dirname, "..", "config", "server", "config.json");
const configFull = path.join(__dirname, "..", "scripts", "config-full.json");
const logger = require('log4js').getLogger('compareConfig.js');

var configFile1 = JSON.parse(require('fs').readFileSync(config, 'utf8'));
var configFile2 = JSON.parse(require('fs').readFileSync(configFull, 'utf8'));

let diff = compare(configFile1, configFile2);
logger.trace(diff);
module.exports = diff;

/**
 *
 * @param {*} a first config
 * @param {*} b second config
 * @return {*} result Returns the result
 */
function compare(a, b) {
  var result = {
    different_values: [],
    missing_in_config_json: [],
    missing_in_compare_to_file: []
  };

  _.reduce(a, function(result, value, key) {
    if (b.hasOwnProperty(key)) {
      if (_.isEqual(value, b[key])) {
        return result;
      }
      if (typeof (a[key]) != typeof ({}) || typeof (b[key]) != typeof ({})) {
            // dead end.
        result.different_values.push(key);
        return result;
      }
      var deeper = compare(a[key], b[key]);
      result.different_values = result.different_values.concat(_.map(deeper.different_values, subPath => {
        return key + "." + subPath;
      }));

      result.missing_in_compare_to_file = result.missing_in_compare_to_file.concat(_.map(deeper.missing_in_compare_to_file, subPath => {
        return key + "." + subPath;
      }));

      result.missing_in_config_json = result.missing_in_config_json.concat(_.map(deeper.missing_in_config_json, subPath => {
        return key + "." + subPath;
      }));
      return result;
    }
    result.missing_in_compare_to_file.push(key);
    return result;
  }, result);

  _.reduce(b, function(result, value, key) {
    if (a.hasOwnProperty(key)) {
      return result;
    }
    result.missing_in_config_json.push(key);
    return result;
  }, result);

  return result;
}
