/**
 * Module helps to organize work with asymmetric cryptography.
 * It consist basic functions to work with it.
 * @module API/Service/ng-rt-core/keys
 */

/* global window */

'use strict';

var keys = (function() {
  // depends on bs58
  // and libsodium: https://jedisct1.gitbooks.io/libsodium/content/
  var bs58 = (typeof module === 'undefined') ? window.bs58 : require('./bs58');
  var sodium = (typeof module === 'undefined') ? window.sodium : require('libsodium-wrappers');

  return {

    /**
     * Generate sodium keypair in bs58 format
     * @return {object} { prvkey : ..., pubkey : ... }
     */

    generate_bs58: function() {
      var keypair = this.generate();
      return {
        prvkey: this.bs58_encode(keypair.prvkey),
        pubkey: this.bs58_encode(keypair.pubkey)
      };
    },

    /**
     * Generate libsodium keypair
     * @return {object} { prvkey : ..., pubkey : ... }
     */

    generate: function() {
      var keypair = sodium.crypto_sign_keypair();
      return {
        prvkey: keypair.privateKey,
        pubkey: keypair.publicKey
      };
    },

    /**
     * Converts an Ed25519 public key to a Curve25519 public key
     * @param prvkey - Ed25519 public key
     * @returns {*}
     */

    pubenc: function(prvkey) {
      return sodium.crypto_sign_ed25519_pk_to_curve25519(prvkey);
    },

    /**
     * Converts an Ed25519 secret key to a Curve25519 secret key
     * @param prvkey - Ed25519 public key
     * @returns {*}
     */

    prvenc: function(pubkey) {
      return sodium.crypto_sign_ed25519_sk_to_curve25519(pubkey);
    },

    /**
     * Produce random buffer
     * @return {string} random bytes buffer
     */

    nonce: function() {
      return sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
    },

    /**
     * Encode string to bs58 format
     * @param  {string} string to encode
     * @return {string} encoded string
     */

    bs58_encode: function(key) {
      return bs58.encode(key);
    },

    /**
     * Decode string from bs58 format
     * @param  {string} string to decode
     * @return {string} decoded string
     */

    bs58_decode: function(str) {
      return new Uint8Array(bs58.decode(str));
    },

    /**
     * Make a hash of content
     * @param  {string} content
     * @return {string} hash
     */

    crypto_hash: function(content) {
      return sodium.crypto_hash(content);
    },

    /**
     * Sign content using private key
     * @param  {string} content
     * @param  {string} secret key
     * @return {string} signed content
     */

    async_sign: function(content, key) {
      return sodium.crypto_sign_detached(content, key);
    },

    /**
     * Verifies that signature is a valid for the content, using the signer's public key.
     * @param  {string} signature
     * @param  {string} content
     * @param  {string} key - public key
     * @return {string} signed content
     */

    async_verify: function(signature, content, key) {
      return sodium.crypto_sign_verify_detached(signature, content, key);
    },

    /**
     * Encrypts a content for a recipient whose public key is provided.
     * @param  {string} content
     * @param  {string} key - public key
     * @return {string} signed content
     */

    async_encrypt: function(content, pubkey) {
      return sodium.crypto_box_seal(content, pubkey);
    },

    /**
     * Decrypts a content for a recipient whose public key is provided using private key.
     * @param  {string} content
     * @param  {string} key - public key
     * @param  {string} key - private key
     * @return {string} signed content
     */

    async_decrypt: function(content, pubkey, prvkey) {
      return sodium.crypto_box_seal_open(content, pubkey, prvkey);
    },

    /**
      * Encrypts a message, with a recipient's public key, a sender's secret key and a nonce.
      * @param  {string} content
      * @param  {string} nonce
      * @param  {string} pubkey - public key of recipient
      * @param  {string} prvkey - private key of sender
      * @return {string} signed content
      */

    async_encrypt_sign: function(content, nonce, pubkey, prvkey) {
      return sodium.crypto_box_easy(content, nonce, pubkey, prvkey);
    },

    /**
     * Verifies and decrypts a content ciphertext
     * @param  {string} content input data
     * @param  {string} nonce nonce
     * @param  {string} pubkey - public key
     * @param  {string} prvkey - private key
     * @return {string} signed content
     */
    async_decrypt_verify: function(content, nonce, pubkey, prvkey) {
      return sodium.crypto_box_open_easy(content, nonce, pubkey, prvkey);
    },

    /**
     * Produce random buffer. Easy way to generate a nonce
     * @return {string} random bytes buffer
     */

    symNonce: function() {
      return sodium.randombytes_buf(sodium.libsodium._crypto_secretbox_noncebytes());
    },

    /**
     * Produce random buffer
     * @return {string} random bytes buffer
     */

    symKey: function() {
      return sodium.randombytes_buf(sodium.libsodium._crypto_secretbox_keybytes());
    },

    /**
     * Encrypts a content message, with a provided key and nonce.
     * @param content
     * @param key
     * @param nonce
     * @returns {string} encrypted content
     */

    symEncrypt: function(content, key, nonce) {
      return sodium.crypto_secretbox_easy(content, nonce, key);
    },

    /**
     * Dectypt a message, with a provided key and nonce.
     * @param decrypted content
     * @param key
     * @param nonce
     * @returns {*}
     */

    symDecrypt: function(content, key, nonce) {
      return sodium.crypto_secretbox_open_easy(content, nonce, key);
    }
  };
})();
if (typeof module !== 'undefined')
  module.exports = keys;
