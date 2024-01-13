'use strict';
const jwt = require('jsonwebtoken');
const logger = require('log4js').getLogger('ng-rt-jwt-auth.services');
const EncryptedMessage = require('./EncryptedMessage');
/**
 * API/Service/Auth
 *
 * @module API/Service/Auth
 * @type {function}
 */

/**
 * JWT-AUTH.services
 * @type {factory}
 * @param {Object} configService - service's configuration factory
 * @param {Object} utils - set of common routines
 * @return {Object} jwt-auth api
 */
const service = (configService, utils) => {
  const JWT_SECRET = configService.get("jwt.secret");
  return {

    /**
     * Generate and send session token
     * @param {Object} req - request object
     * @param {Object} res - response object
     * @param {Object} payload - payload data
     * @private
     */
    _generateAndReplySessionToken: (req, res, payload) => {
      let period = payload.remember_me ?
        configService.get('jwt.rememberMeTime') :
        configService.get('jwt.sessionTime');
      if (!payload.sessionId)
        payload.sessionId = utils.generateId();
      let token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: period
      });

      res.cookie('session', token, {path: '/', maxAge: (period - 5) * 1000});
      logger.trace('JWT Token : ', token);
      res.send({
        token: token,
        u2f: payload.u2f
      });
    },

    /**
     * Generate and send application token
     * @param {Object} req - request object
     * @param {Object} res - response object
     * @param {Object} payload - payload data
     * @private
     */
    _generateApplicationToken: (req, res, payload) => {
      let period = configService.get('jwt.sessionTime');
      logger.trace("generate token:", payload, JWT_SECRET, {
        expiresIn: period
      });
      if (!payload.sessionId)
        payload.sessionId = utils.generateId();
      let token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: period
      });
      res.cookie('session', token, {path: '/', maxAge: (period - 5) * 1000});
      res.send({
        token: token
      });
    },

    /**
     * Generate and send tokens for ssh keys
     * @param {Object} req - request object
     * @param {Object} res - response object
     * @param {Object} payload - payload data
     * @param {Array} keys - ssh keys
     * @param {String} fingerprint - hash of key
     * @private
     */
    _generateSshTokens: (req, res, payload, keys, fingerprint) => {
      let period = configService.get('jwt.sessionTime');
      logger.trace("generate ssh token:", payload, JWT_SECRET, {
        expiresIn: period
      });
      let key = keys.find(k => k.fingerprint === fingerprint);
      if (!payload.sessionId)
        payload.sessionId = utils.generateId();
      let token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: period
      });

      let message = new EncryptedMessage(token, key.key);
      message.encrypt().then(messages => {
        res.send({
          token: messages
        });
      }).catch(err => {
        res.status(500).send(err);
      });
    }
  };
};

module.exports = service;
