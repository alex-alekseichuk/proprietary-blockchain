'use strict';

const qs = require('querystring');
const request = require('request-promise');
const crypto = require('crypto');

/*
 * Yubico Validation Protocol v2.0
 * http://code.google.com/p/yubikey-val-server-php/wiki/ValidationProtocolV20
 */

const STATUS = {
  OK: 'The OTP is valid.',
  BAD_OTP: 'The OTP is invalid format.', // sic
  REPLAYED_OTP: 'The OTP has already been seen by the service.',
  BAD_SIGNATURE: 'The HMAC signature verification failed.',
  MISSING_PARAMETER: 'The request lacks a parameter.',
  NO_SUCH_CLIENT: 'The request id does not exist.',
  OPERATION_NOT_ALLOWED: 'The request id is not allowed to verify OTPs.',
  BACKEND_ERROR: 'Unexpected error in our server. Please contact us if you see this error.',
  NOT_ENOUGH_ANSWERS: 'Server could not get requested number of syncs during before timeout.',
  REPLAYED_REQUEST: 'Server has seen the OTP/Nonce combination before.'
};

const VERIFIERS = [
  'api.yubico.com',
  'api2.yubico.com',
  'api3.yubico.com',
  'api4.yubico.com',
  'api5.yubico.com'
];

 /**
  * Convert Yubico response body to params dictionary.
  * @param {*} body Body of the request
  * @return {string} params return parameters
  */
function bodyToParams(body) {
  var params = {};

  body = body.trim();
  body.split('\n').forEach(function(line) {
    var match = line.trim().match(/^(\w+)=(.*)$/);
    if (match) {
      params[match[1]] = match[2];
    }
  });
  return params;
}

 /**
  * The Yubikey api has a single method, verify(otp)
  * @param {*} clientId ClientId
  * @param {*} secretKey SecretKey
  */
function Yubikey(clientId, secretKey) {
  this.clientId = clientId || process.env.YUBIKEY_CLIENT_ID;
  this.secretKey = secretKey || process.env.YUBIKEY_SECRET_KEY;

  if (!(this.clientId && this.secretKey)) {
    throw new Error("need client id and secret key");
  }
}

Yubikey.prototype = {
  verify: function yubikeyVerify(otp) {
    const self = this;
    return new Promise((resolve, reject) => {
      this._genNonceAsync(function(err, nonce) {
        if (err) return reject(err);
        const params = {
          nonce: nonce,
          otp: otp,
          id: self.clientId
        };
        params.h = self._genSignatureSync(params);
        self._request(params, (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        });
      });
    });
  },

  _request: function yubikeyRequest(params, callback) {
    const self = this;
    var uri = 'https://' + this._chooseVerifier() +
      '/wsapi/2.0/verify?' + this._querify(params, true);

    request({
      uri,
      resolveWithFullResponse: true
    }).then(res => {
      if (res.statusCode !== 200) {
        return callback(new Error("Server returned code " + res.statusCode));
      }

      var responseParams = bodyToParams(res.body);
      if (responseParams.status !== 'OK') {
        return callback(new Error(STATUS[responseParams.status]));
      }

      self._validateResponse(responseParams, params, callback);
    });
    // request(uri, function(err, res, body) {
    //   if (res.statusCode !== 200) {
    //     return callback(new Error("Server returned code " + res.statusCode));
    //   }
    //
    //   var responseParams = bodyToParams(body);
    //   if (responseParams.status !== 'OK') {
    //     return callback(new Error(STATUS[responseParams.status]));
    //   }
    //
    //   this._validateResponse(responseParams, params, callback);
    // }.bind(this));
  },

  _validateResponse: function yubikeyValidateResponse(response, request, callback) {
    // Check individual params
    if (response.otp !== request.otp) {
      return callback(new Error("Response OTP does not match request"));
    }
    if (response.nonce !== request.nonce) {
      return callback(new Error("Response nonce does not match request"));
    }
    if (!response.h) {
      return callback(new Error("Response does not include a signature"));
    }

    // Verify the signature in the incoming message.  Remove the signature from
    // the values used for verification.
    var responseSignature = response.h;
    delete response.h;
    if (this._genSignatureSync(response) !== responseSignature) {
      return callback(new Error("Response signature is invalid"));
    }

    return callback(null, true);
  },

  /*
   * Choose a yubico verifier at random
   */
  _chooseVerifier: function yubikeyChooseVerifier() {
    return VERIFIERS[Math.floor(Math.random() * VERIFIERS.length)];
  },

  /*
   * Construct a single line with each ordered key/value pair concatenated
   * using '&', and each key and value concatenated using '='.
   *
   * Set doEscape=true to uri encode the values.
   */
  _querify: function yubikeyQuerify(params, doEscape) {
    return Object
      .keys(params)
      .sort()
      .map(function(key) {
        if (doEscape) {
          var d = {};
          d[key] = params[key];
          return qs.stringify(d);
        }
        return key + '=' + params[key];
      })
      .join('&');
  },

  /*
   * The nonce should be a 16- to 40-character-long string containing
   * random, unique data.
   */
  _genNonceAsync: function yubikeyGenNonceAsync(callback) {
    // Create a secure, random nonce value
    crypto.randomBytes(40, function(err, buf) {
      if (err) return callback(err);
      return callback(null, buf.toString('hex').slice(0, 40));
    });
  },

  /*
   * From the Yubico documentation:
   *
   * The protocol uses HMAC-SHA-1 signatures. The HMAC key to use is the client
   * API key.
   *
   * Generate the signature over the parameters in the message. Each message
   * contains a set of key/value pairs, and the signature is always over the
   * entire set (excluding the signature itself), and sorted in alphabetical
   * order of the keys. More precisely, to generate a message signature do:
   *
   * 1. Alphabetically sort the set of key/value pairs by key order.
   *
   * 2. Construct a single line with each ordered key/value pair concatenated
   *    using '&', and each key and value contatenated with '='. Do not add any
   *    linebreaks. Do not add whitespace. For example: a=2&b=1&c=3.
   *
   * 3. Apply the HMAC-SHA-1 algorithm on the line as an octet string using the
   *    API key as key.
   *
   * 4. Base 64 encode the resulting value according to RFC 4648, for example,
   *    t2ZMtKeValdA+H0jVpj3LIichn4=.
   *
   * 5. Append the value under key 'h' to the message.
   */
  _genSignatureSync: function yubikeyGenSignatureSync(params) {
    var buf = Buffer.from(this.secretKey, 'base64');// .toString('binary');
    var hmac = crypto.createHmac('sha1', buf);
    return hmac.update(this._querify(params)).digest('base64');
  }
};

module.exports = Yubikey;
