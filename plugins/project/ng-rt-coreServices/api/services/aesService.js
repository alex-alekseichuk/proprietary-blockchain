'use strict';

let crypto = require('crypto');
let algorithm = 'aes-256-ctr';
let password = 'd6F3Efeq'; // @todo take password from CONFIG
/**
 * API/Service/aesService
 *
 * @module API/Service/aesService
 * @type {object}
 */
/**
 * Encrypt text data
 * @param {String} text - encrypted string
 * @return {String} encrypted string
 */
function encrypt(text) {
  let cipher = crypto.createCipher(algorithm, password);
  let crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}

/**
 * Decrypt text data
 * @param {String} text - decrypted string
 * @return {String} decrypted string
 */
function decrypt(text) {
  let decipher = crypto.createDecipher(algorithm, password);
  let dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

/**
 * Encrypt data as buffer
 * @param {Object} buffer - encrypted buffer
 * @return {Object} encrypted buffer
 */
function encryptBuffer(buffer) {
  let cipher = crypto.createCipher(algorithm, password);
  return Buffer.concat([cipher.update(buffer), cipher.final()]);
}

/**
 * Decrypt buffer as data
 * @param {Object} buffer decrypted buffer
 * @return {Object} decrypted buffer
 */
function decryptBuffer(buffer) {
  let decipher = crypto.createDecipher(algorithm, password);
  return Buffer.concat([decipher.update(buffer), decipher.final()]);
}

/**
 * API/Service/StorageProviders
 *
 * @module API/Service/StorageProviders
 * @type {object}
 */
module.exports = {
  encrypt: encrypt,
  decrypt: decrypt,
  encryptBuffer: encryptBuffer,
  decryptBuffer: decryptBuffer
};
