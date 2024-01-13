'use strict';

var logger = require('log4js').getLogger('key_sec');

var querystring = require('querystring');

var ObjectID = require('mongodb').ObjectID;

// var sha3 = require('js-sha3');

module.exports = function(env, memory) {
  this.init = function(documentId, timeoutSec, fileName, mailKeyHash, clientId) {
    // mailKeyHash = "123132sdfsdfsfs";

    var memory = {};

    memory.documentId = documentId;

    memory.accessLog = [];

    memory.serversList = [];

    memory.timeout = parseInt(timeoutSec, 10);

    memory.filename = fileName;

    memory.created = new Date().getTime();

    memory.mailKeyHash = mailKeyHash;

    memory.clientId = new ObjectID(clientId);

    // memory.clientId = clientId;

    // memory.emailsTable = [];

    return memory;
  };

  this.createLogEvent = function(pubKey, clientIp, offchainCall) {
    // var email = memory.emailsTable[pubKey];

    var event = {
      clientIp: clientIp,
      serverIp: env.ownIp,
      pubKey: pubKey,
      offchainCall: offchainCall,
      timestamp: new Date().getTime()
    };

    return event;
  };

  this.saveSecretSecret = function * (pubKey, secretSecret, isAdmin, offchainCall) {
    memory.serversList = [];

    var dbId = memory.documentId + pubKey;

    var nodesList = env.nodesList();

    isAdmin = (isAdmin === 'true');

    // Contains the following information
    // - secretSecret key
    // - expiration timestamp
    let secretData = {};

    // If user isn't admin and SC type isn't INFINITY
    // Then add expiration timestamp
    if (!isAdmin && memory.timeout != 3214080000) {
      secretData.expires = true;
      secretData.expiresAt = Date.now() + memory.timeout * 1000;
    } else {
      secretData.expires = false;
    }

    /** delete from **/
    if (!offchainCall && nodesList && nodesList.length !== 0) {
      var length = Math.ceil(secretSecret.length / (nodesList.length + 1));

      var secretSecretArray = secretSecret.match(new RegExp('.{1,' + length + '}', 'g'));

      /*
       *   Distribute key parts between the servers
       * */

      for (var i = 0; i < nodesList.length; i++) {
        var ip = nodesList[i];

        var part = secretSecretArray[i];

        var result = yield env.http.get(ip, "/sc-api/call/" + env.getOwnContractId() + "/saveSecretSecret/" + querystring.escape(pubKey) + "@" + querystring.escape(part) + "@" + isAdmin + "@true/2SRYD7njZV28cWtN8b6hioDrftUXKemDY6v2wuoWZrAW/62xEiowgZDA9uXURt1RkLYZ35GPu95jCwBkv81ZCdhgo"); // eslint-disable-line

        memory.serversList.push(ip);
      }

      /*
       * Save last part locally
       **/
      secretData.secretsecret = secretSecretArray[secretSecretArray.length - 1];
      yield env.offChain.save(dbId, secretData); // eslint-disable-line

      memory.serversList.push(env.ownIp);
    } else {
      /*
       * Save part of the key
       **/
      secretData.secretsecret = secretSecret;
      yield env.offChain.save(dbId, secretData);
    }

    /*
     *  Each server will delete part of the key after timeout (sec)
     * */

    if (!isAdmin && memory.timeout != 3214080000) {
      setTimeout(function() {
        // env.offChain.delete(dbId);

        let secretData = {
          secretsecret: "expired"
        };

        env.offChain.update(dbId, secretData);
      }, memory.timeout * 1000);
    }

    if (!offchainCall) {
      return {
        memory: memory,
        hiddenArgs: [1] // args which will not saved in blockchain after a contract call - secret-secret in this case
      };
    }
    return true;
  };

  this.getSecretSecret = function * (pubKey, clientIp, mailKey, offchainCall) {
    /*
     *     Access Logging    *
     *
     *     todo: log offchainCall
     * */
    /*
     var hash = sha3.keccak_256(mailKey);

     if (hash != memory.mailKeyHash)
     {
     logger.error("wrong mailKey");
     return false;
     }
     */

    memory.accessLog.push(this.createLogEvent(pubKey, clientIp, offchainCall));

    /*
     *  TODO : devide for 2 calls. In second check that log event in array   *
     * */

    /*
     *     GET
     * */

    var dbId = memory.documentId + pubKey;

    var nodesList = env.nodesList();

    let secretSecret;

    if (!offchainCall && nodesList && nodesList.length != 0) { // call initiated by http api
      secretSecret = "";

      var partExpired = false;

      for (var i = 0; i < memory.serversList.length; i++) {
        var ip = memory.serversList[i];

        if (ip == env.ownIp) {
          continue;
        }

        var part = yield env.http.get(ip, `/sc-api/call/${env.getOwnContractId()}/getSecretSecret/${querystring.escape(pubKey)}@${clientIp}@${mailKey}@true/2SRYD7njZV28cWtN8b6hioDrftUXKemDY6v2wuoWZrAW/62xEiowgZDA9uXURt1RkLYZ35GPu95jCwBkv81ZCdhgo`);

        logger.debug("part from " + ip + " :", part);

        secretSecret += part.result;

        if (part.result == "expired") {
          partExpired = true;
        }
      }

      var secretSecretLastPart = yield env.offChain.get(dbId);
      secretSecretLastPart = secretSecretLastPart.value.secretsecret;

      if (secretSecretLastPart == "expired" || partExpired) {
        secretSecret = "expired";
      } else if (!secretSecretLastPart) { // eslint-disable-line
        secretSecret = "notfound";
      } else {
        secretSecret += secretSecretLastPart;
      }

      return {
        result: secretSecret,
        memory: memory
      };
    }

    secretSecret = yield env.offChain.get(dbId);  // eslint-disable-line // part of secret-secret from one of the server
    secretSecret = secretSecret.value.secretsecret;
      // return secretSecret;
    return {
      result: secretSecret, // eslint-disable-line
      memory: memory
    };
  };
};
