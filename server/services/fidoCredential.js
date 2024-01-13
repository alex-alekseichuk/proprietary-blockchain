/**
 * FidoCredential Service
 */
'use strict';
const FidoCredBackend = require('../backend/fidoCredential');

module.exports = app => {
  /**
   * API/Service/fidoCredential
   * handles yubikeys of user for fido2-u2f 2-factor authentication.
   * @module API/Service/fidoCredential
   * @type {object}
   */
  return {

    /**
     * Returns Fido-U2f registration challenge
     * @param {string} userId - Id of the user
     * @param {string} username - name of the user
     * @param {string} userVerification - one of ['preferred', 'discouraged', 'required']
     * @return {object} - registration challenge to be signed by the authenticator
     */
    generateServerMakeCredChallenge: function(userId, username, userVerification) {
      return this.getCredentials(userId)
        .then(excred => FidoCredBackend.generateServerMakeCredRequest(username, userId, excred, userVerification));
    },

    /**
     * Returns Fido-U2f registration challenge
     * @param {string} inccred - Already registered credentials for the user
     * @param {string} userVerification    - one of ['preferred', 'discouraged', 'required']
     * @return {object} - authentication challenge to be signed by the authenticator
     */
    generateServerGetCredChallenge: async function(inccred, userVerification) {
      return FidoCredBackend.generateServerGetCredRequest(inccred, userVerification);
    },

    /**
     * Returns Fido-U2f credentials of user
     * @param {string} userId - Id of the user
     * @return {Promise} Promise containing user credentials or rejection error
     */
    getCredentials: async function(userId) {
      return app.models.fidoCredential.find({where: {userId: userId}});
    },

    /**
     * Verifies and saves/updates fidocred for user
     * @param {string} fidocred - fidocred to save
     * @param {string} userId - Id of the user
     * @param {string} challenge - challenge to be signed
     * @param {string} isNew - true if we are registering a new credential, false if we are updating existing credential
     * @return {Promise} Promise containing containing success status 200 or err
     */
    createOrUpdateCredential: function(fidocred, userId, challenge, isNew) {
      return new Promise((resolve, reject) => {
        this.getCredentials(userId)
        .then(inclcred => {
          let authr = FidoCredBackend.findAuthr(fidocred.id, inclcred);
          if ((isNew && authr) || (!isNew && !authr)) {
            reject({status: 400, message: "Inconsistent fido2 request"});
            return;
          }
          fidocred = FidoCredBackend.verifyWebAuthnResponse(fidocred, challenge, inclcred);
          if (fidocred.verified) {
            fidocred.authr.userId = userId;
            app.models.fidoCredential.upsert(fidocred.authr, (err, res) => {
              if (err)
                reject(err);
              else
                return resolve({status: 200});
            });
          } else
            reject({status: 401, message: 'fido-u2f credential could not be verified'});
        })
        .catch(err => reject(err));
      });
    },

    /**
     * Delete fidocred by id
     * @param {string} credID - Id of the credential to delete
     * @param {string} userID - Id of the user possesing the credential
     * @return {string} id - Id of the deleted credential
     */
    delete: function(credID, userID) {
      return new Promise((resolve, reject) => {
        app.models.fidoCredential.destroyAll({credID: credID, userID: userID}, err => {
          if (err)
            return reject(err);
          resolve(credID);
        });
      });
    },

    /**
     * Returns options of the user
     * @param {String} userId ID of the user
     * @return {Promise} res Contains options of the usr
     */
    getOptions: function(userId) {
      return app.models.user.findById(userId).then(user => {
        return {u2f: user.u2f};
      });
    },

    /**
     * Saves options for user
     * @param {String} userId Id of the user to save options
     * @param {String} u2f Options to save
     * @return {Promise} empty object
     */
    saveOptions: function(userId, u2f) {
      return app.models.user.findById(userId).then(user => {
        user.updateAttribute('u2f', u2f);
        return {};
      });
    }

  };
};
