/**
 * Handles loopback model actions
 */
'use strict';
const logger = require('log4js').getLogger('services.loopbackModelDecorator');
const uuid = require('uuid');

/**
 * API/Service/loopbackModelDecorator
 * decorator for loopback models, include most of CRUD API loopback models
 * @module API/Service/loopbackModelDecorator
 * @type {object}
 */

module.exports = (loopbackApp, i18n) => {
  return {
    /**
     * find all matches
     * @param {string} modelName - name of the model
     * @param {Object} qStr - query string
     * @param {Object} ctx - context of request
     * @return {Promise} result
     */
    find: (modelName, qStr, ctx) => _actionModelHandler(modelName, qStr, ctx, 'find'),

    /**
     * find first match
     * @param {string} modelName - name of the model
     * @param {Object} qStr - query string
     * @param {Object} ctx - context of request
     * @return {Promise} result
     */
    findOne: (modelName, qStr, ctx) => _actionModelHandler(modelName, qStr, ctx, 'findOne'),

    /**
     * find by ID
     * @param {string} modelName - name of the model
     * @param {Object} qStr - query string
     * @param {Object} ctx - context of request
     * @param {string} id - id of the model
     * @return {Promise} result
     */
    findById: (modelName, qStr, ctx, id) => {
      qStr = qStr || {};
      qStr.where = {id};
      return _actionModelHandler(modelName, qStr, ctx, 'find');
    },

    /**
     * insert entry or update if exists
     * @param {string} modelName - name of the model
     * @param {Object} qStr - query string
     * @param {Object} ctx - context of request
     * @return {Promise} result
     */
    upsert: (modelName, qStr, ctx) => _actionModelHandler(modelName, qStr, ctx, 'upsert'),

    /**
     * update entry
     * @param {string} modelName - name of the model
     * @param {Object} qStr - query string
     * @param {Object} ctx - context of request
     * @param {Object} data - data for update entry
     * @return {Promise} result
     */
    updateAll: (modelName, qStr, ctx, data) => _actionModelHandler(modelName, qStr, ctx, 'updateAll', data),

    /**
     * create entry
     * @param {string} modelName - name of the model
     * @param {Object} qStr - query string
     * @param {Object} ctx - context of request
     * @return {Promise} result
     */
    create: (modelName, qStr, ctx) => _actionModelHandler(modelName, qStr, ctx, 'create'),

    /**
     * delete entry
     * @param {string} modelName - name of the model
     * @param {Object} qStr - query string
     * @param {Object} ctx - context of request
     * @return {Promise} result
     */
    delete: (modelName, qStr, ctx) => _actionModelHandler(modelName, qStr, ctx, 'deleteById'),

    /**
     * delete by ID
     * @param {string} modelName - name of the model
     * @param {Object} qStr - query string
     * @param {Object} ctx - context of request
     * @param {string} id - id of the model
     * @return {Promise} result
     */
    deleteById: (modelName, qStr, ctx, id) => {
      qStr = {id};
      return _actionModelHandler(modelName, qStr, ctx, 'destroyAll');
    },

    /**
     * count entries
     * @param {string} modelName - name of the model
     * @param {Object} qStr - query string
     * @param {Object} ctx - context of request
     * @return {Promise} result
     */
    count: (modelName, qStr, ctx) => _actionModelHandler(modelName, qStr, ctx, 'count')
  };

  /**
   * model handler
   * transfer action for model, add the missing properties to query string
   * @param {string} modelName - name of the model
   * @param {Object} qStr - query string
   * @param {Object} ctx - context of request
   * @param {string} action - model action, which supported by loopback
   * @param {string=} data - data for updateAll
   * @return {Promise} result
   */
  function _actionModelHandler(modelName, qStr, ctx, action, data) {
    let model;
    try {
      model = _getModel(modelName);
    } catch (e) {
      return Promise.reject(e);
    }
    let _qStr = qStr;

    // handling Domain
    if (_isMixinExist(model, 'Domain')) {
      _qStr = _addDomainInfo(_qStr, ctx, action);
    }

    // handling record observer
    if (_isMixinExist(model, 'RecordObserver')) {
      _qStr = _addModifyInfo(_qStr, ctx, action);
    }

    if (action === 'updateAll') {
      return model[action](_qStr, data);
    }
    return model[action](_qStr);
  }

  /**
   * add domain info to the query string
   * @param {Object} qStr - query string
   * @param {Object} ctx - context of request
   * @param {string} action - filter for queries, with 'find' filter using 'where' combination
   * @return {Object} qStr - query string
   */
  function _addDomainInfo(qStr, ctx, action) {
    qStr = qStr || {};
    if (!ctx.user) {
      logger.trace(i18n.__(`No user info found`));
      return qStr;
    }

    if (!ctx.user.domainId) {
      logger.trace(i18n.__(`No domainId info found`));
      qStr.domainId = null;
      return qStr;
    }

    switch (action) {
      case 'find':
      case 'findOne':
        qStr.where = qStr.where || {};
        qStr.where = {
          and: [
            qStr.where,
            {
              or: [
                {domainId: ctx.user.domainId},
                {domainId: null}
              ]
            }]
        };
        return qStr;
      case 'updateAll':
      case 'destroyAll':
        qStr = {
          and: [
            qStr,
            {
              or: [
                {domainId: ctx.user.domainId},
                {domainId: null}
              ]
            }
          ]
        };
        return qStr;
      default:
        qStr.domainId = ctx.user.domainId;
        return qStr;
    }
  }

  /**
   * add modify by, created by, uuid info to the query string
   * @param {Object} qStr - query string
   * @param {Object} ctx - context of request
   * @param {string} action - filter for queries, with 'find' filter using 'where' combination
   * @return {Object} qStr - query string
   */
  function _addModifyInfo(qStr, ctx, action) {
    qStr = qStr || {};
    if (!ctx.user) {
      logger.trace(i18n.__(`No user info found`));
      return qStr;
    }

    // if entry already exist then update modify field and record
    switch (action) {
      case 'create':
        qStr.modifiedBy = ctx.user.id;
        qStr.recordStatus = 'A';
        qStr.createdBy = ctx.user.id;
        qStr.uuid = uuid.v4();
        return qStr;
      case 'updateAll':
        qStr.modifiedBy = ctx.user.id;
        qStr.recordStatus = 'A';
        return qStr;
      default:
        return qStr;
    }
  }

  /**
   * check exist mixin name in model
   * @param {Object} model - model object
   * @param {string} mixinName - mixin name
   * @return {boolean} result - true if property domain in mixins exists
   */
  function _isMixinExist(model, mixinName) {
    const mixins = model.definition.settings.mixins || {};
    if (!mixins || Object.keys(mixins).length === 0) {
      return false;
    }
    if (!mixins[mixinName]) {
      return false;
    }
    return true;
  }

  /**
   * get model object
   * @param {string} name - name of the model
   * @return {Object} model
   */
  function _getModel(name) {
    let model = loopbackApp.models[name];
    if (!model) {
      logger.trace(i18n.__(`Model ${name} is not found`));
      throw new Error(i18n.__(`Model ${name} is not found`));
    }
    return model;
  }
};

module.exports.__components = 'loopbackModelDecorator';
module.exports.__dependencies = ['loopbackApp', 'i18n'];
