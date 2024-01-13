'use strict';
var loopback = require('loopback');
var logger = require('log4js').getLogger('sync-listener');
var _ = require('lodash');

var Observer = function(node, modelName, methodName) {
  var _node = node;
  var _modelName = modelName;
  var _methodName = methodName;

  logger.debug('_node %s', _node);
  logger.debug('_modelName %s', _modelName);
  logger.debug('_methodName %s', _methodName);

  logger.debug('cFunction a');

  this.observe = function(ctx, next) {
    logger.debug('Getting into observe');

    var id = _node.id;

    // sort of an hack to return a function in case this method is called by
    // node itself.
    if (ctx === null && next === null) {
      var getNRId = function() {
        return id;
      };

      return getNRId;
    }

    var msg = {};

// eslint-disable-next-line no-negated-condition
    if (ctx.Model !== undefined) {
      msg.payload = ctx.Model.definition.name + '.' + _methodName + ' triggered';
    } else {
      msg.payload = _modelName + '.' + _methodName + ' triggered';
      logger.debug('msg.payload %s ', msg.payload);
    }

    // msg.next = next;
    msg.ctx = JSON.parse(JSON.stringify(ctx));

    msg.next = function(msg) {
      logger.debug('Getting into observe');

      // var updatedCtx = msg.ctx;
      var updatedCtx = JSON.parse(JSON.stringify(msg.ctx));
      // console.log('callback function called. returning to loopback.
      // updatedCtx =', updatedCtx);

      if (updatedCtx.query !== undefined) {
        // ctx.query = updatedCtx.query;
        _.assign(ctx.query, updatedCtx.query);
      }

      if (updatedCtx.instance !== undefined) {
        _.assign(ctx.instance, updatedCtx.instance);
        // console.log('new instance = ', ctx.instance);
      }

      if (updatedCtx.data !== undefined) {
        _.assign(ctx.data, updatedCtx.data);
      }
      next();
    };

    _node.send(msg);
  };
};

module.exports = function(RED) {
  /**
   *
   * @param {*} Model Modelname
   * @param {*} id Id
   */
  function removeOldObservers(Model, id) {
    logger.debug('Function a');
    if (Model._observers === undefined)
      return;

    var types = ['test', 'access', 'before save', 'after save', 'after access'];

// eslint-disable-next-line guard-for-in
    for (var i in types) {
      var observers = Model._observers[types[i]];

      if (observers !== undefined && observers.length !== 0) {
// eslint-disable-next-line guard-for-in
        for (var j in observers) {
          var observer = observers[j];

          var nodeId;

                    // hack to get nodeId.
          try {
            nodeId = observer(null, null)();
                        // console.log('node id received from observer = ',
                        // nodeId);
            if (nodeId === id) {
                            // Id matched. remove this observer
                            // console.log('node id matched. removing this
                            // observer.');
              observers.splice(j, 1);
              j--;
            }
          } catch (e) {
          }
        }
      }
    }
  }

  /**
   *
   * @param {*} config Config
   */
  function SyncObserverNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    var modelName = config.modelname;
    var method = config.method;

    var Model = loopback.findModel(modelName);

    if (Model !== undefined) {
            // console.log ('Model = ', Model._observers[method][0]);

            // Remove existing observers if any.
      logger.debug('observers before removing = ', Model._observers);
      removeOldObservers(Model, node.id);
      logger.debug('observers after removing = ', Model._observers);
      logger.debug('method %s', method);
      logger.debug('node %s', node);
      logger.debug('modelName %s', modelName);

      Model.observe(method, new Observer(node, modelName, method).observe);
    }

    node.on('close', function() {
      logger.debug('node is closing. removing observers');
      if (Model != undefined) {
        logger.debug('observers before removing = ', Model._observers);
        removeOldObservers(Model, node.id);
        logger.debug('observers after removing = ', Model._observers);
      }
    });
  }
  RED.nodes.registerType("sync-listener", SyncObserverNode);
};
