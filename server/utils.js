/**
 * Utilities for server-side node.js code.
 * @module API/Service/utils
 */
'use strict';

const fs = require('fs');
const util = require('util');
const sha3 = require('sha3');
const path = require('path');

const prefix = String(Math.floor(Math.random() * 10));
const postfix = Math.floor(Math.random() * 36).toString(36);
const getNano = () => {
  const hrTime = process.hrtime();
  return hrTime[0] * 1000000000 + hrTime[1];
};
const start = getNano();

/**
 *
 * @param {*} value Value
 * @return {*} Value Value
 */
function hash(value) {
  const hash = new sha3.SHA3Hash();
  if (value)
    hash.update(value);
  return hash.digest('hex');
}

/**
 * @classdesc Error with usefull payload object. Used for transferring reply.
 * @class
 * @param {object} payload simple object to be converted into JSON string to be transferred later
 * @augments Error
 */
function ErrorPayload(payload) {
  Error.call(this);
  this.payload = payload;
}
util.inherits(ErrorPayload, Error);

/**
 * @ignore
 * @return {API/Service/utils} Returns interface of the service
 */
const api = {
  /**
   * Get version info of ng-rt-core build.
   * It includes a version and timestamp of the build.
   * @function
   * @return {string} version info
   * @memberOf module:API/Service/utils
   */
  getVersion: () => {
    const manifestfilePath = path.resolve(global.appBase, 'manifest.json');
    return require(manifestfilePath).version ? require(manifestfilePath).version : 'n.a';
  },

  /**
   * Get text of copyright statement.
   * @function
   * @return {string} copyright text
   * @memberOf module:API/Service/utils
   */
  getCopyright: () => {
    const copyrightfilePath = path.resolve(global.appBase, 'COPYRIGHT');
    return fs.readFileSync(copyrightfilePath);
  },
  /**
   * Hash of provided content.
   * @function
   * @param {string} value The content to be hashed.
   * @return {string} hex string of the hash.
   * @memberOf module:API/Service/utils
   */
  hash: hash,

  /**
   * @type ErrorPayload
   * @memberOf module:API/Service/utils
   */
  ErrorPayload: ErrorPayload,

  /**
   * Generate short ID
   * @function
   * @return {string} generated ID
   * @memberOf module:API/Service/utils
   */
  generateId: () => {
    return prefix + Math.abs(getNano() - start).toString(36) + postfix;
  }
};

module.exports = api;
api.__components = 'utils';
