/**
 * Module helps to organize work with Hashes based on crypto-js see : https://www.npmjs.com/package/crypto-js
 * It consist basic functions to work with it.
 * @module API/blockchain/utils/sha
 */
'use strict';
const crypto = require("crypto");
const algo = "sha256";
const encoding = "hex";
const sha3 = require("js-sha3");

/**
 * Generate SHA256 Hash
 * @return {object} SHA256 Hash
 */
function createHash() {
  return crypto.createHash(algo);
}
/**
 * Update a given SHA256 Hash
 * @param {object} sha256Hash Hash
 * @param {string} data Data to update the SHA256 hash
 * @return {object} sha256Hash Hash
 */
function updateHash(sha256Hash, data) {
  return sha256Hash.update(data);
}
/**
 * Finalize a given SHA256 Hash as a HEX representation
 * @param {object} sha256Hash Hash
 * @return {object} sha256Hash Hash
 */
function finalizeHash(sha256Hash) {
  return sha256Hash.digest(encoding);
}
/**
 * Finalize a given SHA256 Hash as a HEX representation
 * @param {object} sha256Hash Hash
 * @return {string} sha256Hash hash value as a string
 */
function getHash(sha256Hash) {
  return sha256Hash.toString("hex");
}

/**
 * Create,update hash and finalize to hex
 * @param {object} data Data to be hashed
 * @return {string} sha256Hash hex encoded hash
 */
function createUpdateHash(data) {
  return crypto.createHash(algo).update(data).digest("hex");
}

/**
 * Create,update hash and finalize to hex based on bigchaindb driver
 * @param {object} data Data to be hashed
 * @return {string} sha256Hash hex encoded hash
 */
function sha3CreateUpdateHash(data) {
  return sha3.sha3_256.create().update(data).hex();
}

module.exports = {
  createHash,
  getHash,
  updateHash,
  finalizeHash,
  sha3CreateUpdateHash,
  createUpdateHash
};
