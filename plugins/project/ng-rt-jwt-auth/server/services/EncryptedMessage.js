'use strict';
const crypto = require('crypto');

class EncryptedMessage {
  constructor(token, publicKey) {
    this.key = publicKey;
    this.data = new Buffer(token);
  }

  encrypt() {
    return new Promise((resolve, reject) => {
      let messages = [];
      for (var i = 0; i <= this.data.length; i += 256) {
        messages.push(this.data.slice(i, i + 256));
      }
      let encrypteds = [];
      messages.forEach(m => {
        encrypteds.push(this.encryptBlock(m));
      });
      return resolve(encrypteds);
    });
  }

  encryptBlock(message) {
    message = this.checkLength(message);
    let encrypted = crypto.publicEncrypt({
      key: this.key,
      padding: crypto.constants.RSA_NO_PADDING
    }, message).toString('base64');
    return encrypted;
  }

  checkLength(buf) {
    if (buf.length < 256)
      while (buf.length < 256) {
        buf = Buffer.concat([Buffer.from([0]), buf]);
      }
    return buf;
  }
}

module.exports = EncryptedMessage;
