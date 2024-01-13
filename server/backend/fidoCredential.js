/* eslint no-unused-vars: ["error", { "vars": "local" }] */
'use strict';

const configService = require('ng-configservice');
configService.read('config/server/config.json');

const commonCrypto = require('../services').get('crypto');
const cbor = require('cbor');

/**
 * U2F Presence constant
 */
const U2F_USER_PRESENTED = 0x01;

const origin = configService.get("publicDNSName");
const fidoSettings = configService.get('fido2Settings') ? configService.get('fido2Settings')
                                                      : {
                                                        transports: ['usb', 'nfc', 'ble'],
                                                        rpName: "PROJECT Examples Corporation",
                                                        attestation: "direct",
                                                        userVerification: 'discouraged'
                                                      };

/**
 * Takes signature, data and PEM public key and tries to verify signature
 * @param  {Buffer} signature - data signature
 * @param  {Buffer} data - data
 * @param  {String} publicKey - PEM encoded public key
 * @return {Boolean}  - true if signature corresponds to data signed with publicKey
 */
let verifySignature = (signature, data, publicKey) => {
  return require('crypto').createVerify('SHA256')
        .update(data)
        .verify(publicKey, signature);
};

/**
 * Returns SHA-256 digest of the given data.
 * @param  {Buffer} data - data to hash
 * @return {Buffer}      - the hash
 */
let hash = data => {
  return require('crypto').createHash('SHA256').update(data).digest();
};

/**
 * Takes COSE encoded public key and converts it to RAW PKCS ECDHA key
 * @param  {Buffer} COSEPublicKey - COSE encoded public key
 * @return {Buffer}               - RAW PKCS encoded public key
 */
let coseecdhaToPkcs = COSEPublicKey => {
    /*
       +------+-------+-------+---------+----------------------------------+
       | name | key   | label | type    | description                      |
       |      | type  |       |         |                                  |
       +------+-------+-------+---------+----------------------------------+
       | crv  | 2     | -1    | int /   | EC Curve identifier - Taken from |
       |      |       |       | tstr    | the COSE Curves registry         |
       |      |       |       |         |                                  |
       | x    | 2     | -2    | bstr    | X Coordinate                     |
       |      |       |       |         |                                  |
       | y    | 2     | -3    | bstr /  | Y Coordinate                     |
       |      |       |       | bool    |                                  |
       |      |       |       |         |                                  |
       | d    | 2     | -4    | bstr    | Private key                      |
       +------+-------+-------+---------+----------------------------------+
    */

  let coseStruct = cbor.decodeAllSync(COSEPublicKey)[0];
  let tag = Buffer.from([0x04]);
  let x = coseStruct.get(-2);
  let y = coseStruct.get(-3);

  return Buffer.concat([tag, x, y]);
};

/**
 * Convert binary certificate or public key to an OpenSSL-compatible PEM text format.
 * @param  {Buffer} pkBuffer - Cert or PubKey buffer
 * @return {String}             - PEM
 */
let asn1ToPem = pkBuffer => {
  if (!Buffer.isBuffer(pkBuffer))
    throw new Error("asn1ToPem: pkBuffer must be Buffer.");

  let type;
  if (pkBuffer.length == 65 && pkBuffer[0] == 0x04) {
        /*
            If needed, we encode rawpublic key to ASN structure, adding metadata:
            SEQUENCE {
              SEQUENCE {
                 OBJECTIDENTIFIER 1.2.840.10045.2.1 (ecPublicKey)
                 OBJECTIDENTIFIER 1.2.840.10045.3.1.7 (P-256)
              }
              BITSTRING <raw public key>
            }
            Luckily, to do that, we just need to prefix it with constant 26 bytes (metadata is constant).
        */

    pkBuffer = Buffer.concat([
      Buffer.from("3059301306072a8648ce3d020106082a8648ce3d030107034200", "hex"),
      pkBuffer
    ]);

    type = 'PUBLIC KEY';
  } else {
    type = 'CERTIFICATE';
  }

  let b64cert = pkBuffer.toString('base64');

  let PEMKey = '';
  for (let i = 0; i < Math.ceil(b64cert.length / 64); i++) {
    let start = 64 * i;

    PEMKey += b64cert.substr(start, 64) + '\n';
  }

  PEMKey = `-----BEGIN ${type}-----\n` + PEMKey + `-----END ${type}-----\n`;

  return PEMKey;
};

/**
 * Parses authenticatorData buffer.
 * @param  {Buffer} buffer - authenticatorData buffer
 * @return {Object}        - parsed authenticatorData struct
 */
let parseMakeCredAuthData = buffer => {
  let rpIdHash = buffer.slice(0, 32);
  buffer = buffer.slice(32);
  let flagsBuf = buffer.slice(0, 1);
  buffer = buffer.slice(1);
  let flags = flagsBuf[0];
  let counterBuf = buffer.slice(0, 4);
  buffer = buffer.slice(4);
  let counter = counterBuf.readUInt32BE(0);
  let aaguid = buffer.slice(0, 16);
  buffer = buffer.slice(16);
  let credIDLenBuf = buffer.slice(0, 2);
  buffer = buffer.slice(2);
  let credIDLen = credIDLenBuf.readUInt16BE(0);
  let credID = buffer.slice(0, credIDLen);
  buffer = buffer.slice(credIDLen);
  let COSEPublicKey = buffer;

  return {rpIdHash, flagsBuf, flags, counter, counterBuf, aaguid, credID, COSEPublicKey};
};

/**
 * Takes an array of registered authenticators and find one specified by credID
 * @param  {String} credID        - base64url encoded credential
 * @param  {Array} authenticators - list of authenticators
 * @return {Object}               - found authenticator
 */
let findAuthr = (credID, authenticators) => {
  for (let authr of authenticators) {
    if (authr.credID === credID)
      return authr;
  }

  return;
};

/**
 * Parses AuthenticatorData from GetAssertion response
 * @param  {Buffer} buffer - Auth data buffer
 * @return {Object}        - parsed authenticatorData struct
 */
let parseGetAssertAuthData = buffer => {
  let rpIdHash = buffer.slice(0, 32);
  buffer = buffer.slice(32);
  let flagsBuf = buffer.slice(0, 1);
  buffer = buffer.slice(1);
  let flags = flagsBuf[0];
  let counterBuf = buffer.slice(0, 4);
  buffer = buffer.slice(4);
  let counter = counterBuf.readUInt32BE(0);

  return {rpIdHash, flagsBuf, flags, counter, counterBuf};
};

/**
 * Parses Database-fidoCredentials into Webauthn credentials
 * @param  {Buffer} authenticators - array of authenticators
 * @return {Array}        - array of Webauthn public-key credentials
 */
let authToCredentials = authenticators => {
  let credentials = [];

  for (let authr of authenticators) {
    credentials.push({
      type: 'public-key',
      id: authr.credID,
      transports: fidoSettings.transports
    });
  }
  return credentials;
};

/**
 * Generates makeCredentials request
 * @param  {String} username            - username
 * @param  {String} id                  - user's base64url encoded id
 * @param  {String} excludeCredentials  - user's registered crdentials
 * @param {string} userVerification    - one of ['preferred', 'discouraged', 'required']

 * @return {MakePublicKeyCredentialOptions} - server encoded make credentials request
 */
let generateServerMakeCredRequest = (username, id, excludeCredentials, userVerification) => {
  return {
    challenge: commonCrypto.bytesToBase64(commonCrypto.randomBytes(32)),
    rp: {
      name: fidoSettings.rpName
    },

    user: {
      id: commonCrypto.bytesToBase64(Uint8Array.from([id])),
      name: username,
      displayName: username
    },

    attestation: fidoSettings.attestation,

    pubKeyCredParams: [
      {
        type: "public-key",
        alg: -7 // "ES256" IANA COSE Algorithms registry
      }
    ],

    authenticatorSelection:
    {
      userVerification: userVerification ? userVerification : fidoSettings.userVerification
    },

    excludeCredentials: authToCredentials(excludeCredentials)

  };
};

/**
 * Generates getAssertion request
 * @param  {Array} authenticators              - list of registered authenticators
 * @param {string} userVerification    - one of ['preferred', 'discouraged', 'required']
 * @return {PublicKeyCredentialRequestOptions} - server encoded get assertion request
 */
let generateServerGetCredRequest = (authenticators, userVerification) => {
  let allowCredentials = authToCredentials(authenticators);
  if (!userVerification)
    userVerification = fidoSettings.userVerification;
  return {
    challenge: commonCrypto.bytesToBase64(commonCrypto.randomBytes(32)),
    allowCredentials: allowCredentials,
    userVerification: userVerification
  };
};

/**
 *  verifies Webauthn Registration response
 * @param  {Array} webAuthnResponse              - webAuthnresponse
 * @return {Object} - JSON with boolean property verified=true if the Webauthn could be verified and authrInfo.
 */
let verifyAuthenticatorAttestationResponse = webAuthnResponse => {
  let attestationBuffer = commonCrypto.base64ToBytes(webAuthnResponse.response.attestationObject);
  let ctapMakeCredResp = cbor.decodeAllSync(attestationBuffer)[0];
  let authrDataStruct = parseMakeCredAuthData(ctapMakeCredResp.authData);
  let response = {verified: false};

  if (ctapMakeCredResp.fmt === 'fido-u2f' || ctapMakeCredResp.fmt === 'packed') {
    if (!(authrDataStruct.flags & U2F_USER_PRESENTED))
      throw new Error('User was NOT presented during authentication!');

    let clientDataHash = hash(commonCrypto.base64ToBytes(webAuthnResponse.response.clientDataJSON));
    let publicKey = coseecdhaToPkcs(authrDataStruct.COSEPublicKey);
    let PEMCertificate = asn1ToPem(ctapMakeCredResp.attStmt.x5c[0]);
    let signature = ctapMakeCredResp.attStmt.sig;
    let signatureBase;

    if (ctapMakeCredResp.fmt === 'fido-u2f')
      signatureBase = Buffer.concat([Buffer.from([0x00]), authrDataStruct.rpIdHash, clientDataHash, authrDataStruct.credID, publicKey]);
    else
            signatureBase = Buffer.concat([ctapMakeCredResp.authData, clientDataHash]);

    response.verified = verifySignature(signature, signatureBase, PEMCertificate);

    if (response.verified) {
      response.authr = {
        fmt: ctapMakeCredResp.fmt,
        publicKey: commonCrypto.bytesToBase64(publicKey),
        counter: authrDataStruct.counter,
        credID: commonCrypto.bytesToBase64(authrDataStruct.credID)
      };
    }
  } else {
    throw new Error('Unsupported attestation format! ' + ctapMakeCredResp.fmt);
  }

  return response;
};

/**
 *  verifies Webauthn Authentication response
 * @param  {Array} webAuthnResponse - webAuthnResponse
 *  @param  {Array} authenticators  - registered authenticators
 * @return {Object} - JSON with boolean property verified=true if the Webauthn could be verified and authrInfo.
 */
let verifyAuthenticatorAssertionResponse = (webAuthnResponse, authenticators) => {
  let authr = findAuthr(webAuthnResponse.id, authenticators);
  if (!authr)
    throw new Error('No public key found for this signed challenge');

  let authenticatorData = commonCrypto.base64ToBytes(webAuthnResponse.response.authenticatorData);

  let response = {verified: false};
  if (authr.fmt === 'fido-u2f') {
    let authrDataStruct = parseGetAssertAuthData(authenticatorData);

    if (!(authrDataStruct.flags & U2F_USER_PRESENTED))
      throw new Error('User was not presented during authentication!');

    let clientDataHash = hash(commonCrypto.base64ToBytes(webAuthnResponse.response.clientDataJSON));
    let signatureBase = Buffer.concat([authrDataStruct.rpIdHash, authrDataStruct.flagsBuf, authrDataStruct.counterBuf, clientDataHash]);

    let publicKey = asn1ToPem(commonCrypto.base64ToBytes(authr.publicKey));
    let signature = commonCrypto.base64ToBytes(webAuthnResponse.response.signature);

    response.verified = verifySignature(signature, signatureBase, publicKey);

    if (response.verified) {
      if (authrDataStruct.counter <= authr.counter)
        throw new Error('Authr counter did not increase!');

      authr.counter = authrDataStruct.counter;
      response.authr = authr;
    }
  }

  return response;
};

/**
 *  verifies Webauthn response by doing preliminary checks and redirectiong to Auth/Registration validation
 * @param  {Object} webAuthnResponse - webAuthnresponse
 * @param  {String} sessionChallenge - base64 encoded sessionChallenge
 * @param  {Array} authenticators - list of authenticators
 * @return {Object} - JSON with boolean property verified=true if the Webauthn could be verified and authrInfo.
 */
let verifyWebAuthnResponse = (webAuthnResponse, sessionChallenge, authenticators) => {
  let clientData = JSON.parse(commonCrypto.base64ToBytes(webAuthnResponse.response.clientDataJSON));

    /* Check challenge... */
  if (clientData.challenge !== sessionChallenge)
    throw new Error('Challenges don\'t match!');

    /* ...and origin */
  if (clientData.origin !== origin)
    throw new Error('Origins don\'t match!');

  if (webAuthnResponse.response.attestationObject !== undefined)
    return verifyAuthenticatorAttestationResponse(webAuthnResponse);

  if (webAuthnResponse.response.authenticatorData !== undefined)
    return verifyAuthenticatorAssertionResponse(webAuthnResponse, authenticators);

  throw Error('Can not determine type of response!');
};

module.exports = {
  findAuthr,
  generateServerMakeCredRequest,
  generateServerGetCredRequest,
  verifyWebAuthnResponse
};
