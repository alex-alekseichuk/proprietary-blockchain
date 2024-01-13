/**
 * @module API/Service/ng-rt-core/bs58
 */

'use strict';

var bs58 = (function() {
  var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  var ALPHABET_MAP = {};
  var BASE = ALPHABET.length;
  var LEADER = ALPHABET.charAt(0);

  // pre-compute lookup table
  for (var i = 0; i < ALPHABET.length; i++) {
    ALPHABET_MAP[ALPHABET.charAt(i)] = i;
  }

  /**
   * Encode string to bs58 format
   * @param  {string} source to encode
   * @return {string} encoded string
   */
  function encode(source) {
    if (source.length === 0) return '';

    var digits = [0];
    for (var i = 0; i < source.length; ++i) {
      let carry = source[i];
      for (var j = 0; j < digits.length; ++j) {
        carry += digits[j] << 8;
        digits[j] = carry % BASE;
        carry = (carry / BASE) | 0;
      }

      while (carry > 0) {
        digits.push(carry % BASE);
        carry = (carry / BASE) | 0;
      }
    }

    // deal with leading zeros
    for (var k = 0; source[k] === 0 && k < source.length - 1; ++k) {
      digits.push(0);
    }

    // convert digits to a string
    for (var ii = 0, jj = digits.length - 1; ii <= jj; ++ii, --jj) {
      var tmp = ALPHABET[digits[ii]];
      digits[ii] = ALPHABET[digits[jj]];
      digits[jj] = tmp;
    }

    return digits.join('');
  }

  /**
   * Decode string from bs58 format
   * @param  {string} string to decode
   * @return {string} decoded string
   */
  function decode(string) {
    if (string.length === 0) return [];

    var bytes = [0];
    for (var i = 0; i < string.length; i++) {
      var value = ALPHABET_MAP[string[i]];
      if (value === undefined) throw new Error('Non-base' + BASE + ' character');
      let carry = value;
      for (var j = 0; j < bytes.length; ++j) {
        carry += bytes[j] * BASE;
        bytes[j] = carry & 0xff;
        carry >>= 8;
      }

      while (carry > 0) {
        bytes.push(carry & 0xff);
        carry >>= 8;
      }
    }

    // deal with leading zeros
    for (var k = 0; string[k] === LEADER && k < string.length - 1; ++k) {
      bytes.push(0);
    }

    return bytes.reverse();
  }

  return {
    encode: encode,
    decode: decode
  };
})();
if (typeof module !== 'undefined')
  module.exports = bs58;
