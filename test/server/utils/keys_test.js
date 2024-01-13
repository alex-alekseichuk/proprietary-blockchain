'use strict';
const path = require('path');
const chai = require('chai');
chai.should();

describe('/utils/keys.js', function() {
  global.appBase = global.appBase || path.resolve(__dirname, '../../..');
  const keys = require(path.join(global.appBase, 'utils/keys'));

  const content = "ABCDE_12345";

  describe('async cryptography methods', () => {
    it('should generate keypair', done => {
      keys.generate().should.have.all.keys('prvkey', 'pubkey');
      done();
    });

    it('should generate keys encoded by bs58', done => {
      keys.generate_bs58().should.have.all.keys('prvkey', 'pubkey');
      done();
    });

    it('should encode key into bs58, then decode it back', done => {
      var key = keys.generate().prvkey;
      var encoded = keys.bs58_encode(key);
      keys.bs58_decode(encoded).should.be.deep.equal(key);
      done();
    });

    it('should sign by private key, then verify by public key', done => {
      var keypair = keys.generate();
      // var signature = keys.sign(new Buffer(bs58.decode(keypair.prvkey)), content);
      keys.async_verify(keys.async_sign(content, keypair.prvkey), content, keypair.pubkey).should.be.true; // eslint-disable-line no-unused-expressions
      done();
    });

    it('should encrypt by public key, then decrypt by private key', done => {
      var keypair = keys.generate();
      var encrypted = keys.async_encrypt(content, keys.pubenc(keypair.pubkey));
      encrypted.should.not.be.undefined; // eslint-disable-line no-unused-expressions
      var decrypted = keys.async_decrypt(encrypted, keys.pubenc(keypair.pubkey), keys.prvenc(keypair.prvkey));
      (new Buffer(decrypted)).toString().should.be.equal(content);
      done();
    });

    it('should encrypt and sign, then decrypt and verify', done => {
      var keypair1 = keys.generate();
      var keypair2 = keys.generate();
      var nonce = keys.nonce();
      var encrypted = keys.async_encrypt_sign(content, nonce, keys.pubenc(keypair1.pubkey), keys.prvenc(keypair2.prvkey));
      encrypted.should.not.be.undefined; // eslint-disable-line no-unused-expressions
      var decrypted = keys.async_decrypt_verify(encrypted, nonce, keys.pubenc(keypair2.pubkey), keys.prvenc(keypair1.prvkey));
      (new Buffer(decrypted)).toString().should.be.equal(content);
      done();
    });
  });

  describe('sync cryptography methods', () => {
    it('should generate key 32 bytes', done => {
      keys.symKey().should.be.a('uint8array').and.have.lengthOf(32);
      done();
    });

    it('should generate nonce 24 bytes', done => {
      keys.symNonce().should.be.a('uint8array').and.have.lengthOf(24);
      done();
    });

    it('should encrypt, then decrypt', done => {
      const key = keys.symKey();

      // generate nonce by hand
      const aNonce = new Array(24);
      for (let i = 0; i < 24; i++)
        aNonce[i] = i;
      const nonce = new Uint8Array(aNonce);

      const encrypted = keys.symEncrypt(content, key, nonce);
      const decrypted = keys.symDecrypt(encrypted, key, nonce);
      (new Buffer(decrypted)).toString().should.be.equal(content);
      done();
    });
  });
});
