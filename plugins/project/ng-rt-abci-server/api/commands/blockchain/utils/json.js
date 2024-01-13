'use strict';
/**
 *
 * @param {*} str Incoming object to be check
 * @return {boolean}  If true if the incoming object is a JSON object
 */
function isJson(str) {
  try {
    const json = JSON.parse(str);
    if (Object.prototype.toString.call(json).slice(8, -1) !== 'Object') {
      return false;
    }
  } catch (e) {
    return false;
  }
  return true;
}

module.exports = {
  isJson
};
