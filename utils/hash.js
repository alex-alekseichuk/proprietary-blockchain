"use strict";
const crypto = require("crypto");

const ALGORITHM = "sha256"; // Accepted: any result of crypto.getHashes(), check doc dor other options
const SIGNATURE_FORMAT = "hex"; // Accepted: hex, latin1, base64

let getUtils = () => {
  const addHash = hashObject => {
    if (hashObject._hash) {
      delete hashObject._hash;
    }
    let hashString = JSON.stringify(hashObject);
    let hash = crypto.createHash("md5").update(hashString).digest("hex");
    hashObject._hash = hash;
  };
  const getHash = source => {
    let hashString = JSON.stringify(source);
    hashString = hashString.replace("\"undefined\":", "\"id\":");
    let hashObject = JSON.parse(hashString);
    if (hashObject._hash) {
      delete hashObject._hash;
    }
    hashString = JSON.stringify(hashObject);
    return crypto.createHash("md5").update(hashString).digest("hex");
  };
  const verify = (data, pubkey, signature, algorithm = ALGORITHM) => {
    let ver = crypto.createVerify(algorithm);
    ver.update(data);
    return ver.verify(pubkey, signature, SIGNATURE_FORMAT);
  };
  const sign = (privatekey, data, algorithm = ALGORITHM) => {
    let sign = crypto.createSign(ALGORITHM);
    sign.update(data);
    return sign.sign(privatekey, SIGNATURE_FORMAT);
  };

  return {
    addHash: addHash,
    getHash: getHash,
    verify: verify,
    sign: sign
  };
};

module.exports = getUtils();
