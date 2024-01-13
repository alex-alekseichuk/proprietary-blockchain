/**
 * @type {factory}
 * @return {{
 *    unicodeStringToTypedArray: utils.unicodeStringToTypedArray,
 *    makeid: utils.makeid,
 *    convertBinaryStringToUint8Array: utils.convertBinaryStringToUint8Array,
 *    convertUint8ArrayToBinaryString: utils.convertUint8ArrayToBinaryString,
 *    convertWordArrayToUint8Array: utils.convertWordArrayToUint8Array,
 *    typedArrayToUnicodeString: utils.typedArrayToUnicodeString,
 *    _base64ToArrayBuffer: utils._base64ToArrayBuffer
 *    }}
 */
'use strict';

/* global _, window */
/* eslint-disable no-unused-vars */

const nonce = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4]);

const utils = {
  unicodeStringToTypedArray: s => {
    let escstr = encodeURIComponent(s);
    let binstr = escstr.replace(/%([0-9A-F]{2})/g, (match, p1) =>
      String.fromCharCode(`0x${p1}`)
    );
    let ua = new Uint8Array(binstr.length);
    Array.prototype.forEach.call(binstr, (ch, i) => {
      ua[i] = ch.charCodeAt(0);
    });
    return ua;
  },
  makeid: () => {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return _.chain(new Array(5)).map(i =>
      possible.charAt(Math.floor(Math.random() * possible.length))
    ).join('').value();
  },
  convertBinaryStringToUint8Array: bStr => {
    return _.map(new Uint8Array(bStr.length), (el, i) =>
      bStr.charCodeAt(i)
    );
  },
  convertUint8ArrayToBinaryString: u8Array => {
    return _.chain(u8Array)
      .map(i => String.fromCharCode(i))
      .join('')
      .value();
  },
  convertWordArrayToUint8Array: wordArray => {
    var words = wordArray.words;
    var sigBytes = wordArray.sigBytes;
    var u8 = new Uint8Array(sigBytes);
    for (var i = 0; i < sigBytes; i++) {
      var byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      u8[i] = byte;
    }
    return u8;
  },
  typedArrayToUnicodeString: ua => {
    return Array.prototype.map.call(ua, ch =>
      String.fromCharCode(ch)
    ).join('');
  },
  _base64ToArrayBuffer: base64 => {
    var binaryString = window.atob(base64);
    var bytes = new Uint8Array(binaryString.length);

    bytes.forEach((el, i) => {
      bytes[i] = binaryString.charCodeAt(i);
    });

    return bytes.buffer;
  },
  nonce: () => nonce
};
