'use strict';

var loopback = require('loopback');
var logger = require('log4js').getLogger('ui-listener');

var Observer = function(node, spaId, event) {
  var _node = node;
  var _modelName = spaId;
  var _eventName = event;

  logger.trace('_node %s', _node);
  logger.trace('_spaId %s', _modelName);
  logger.trace('_methodName %s', _eventName);

  this.observe = function(ctx, next) {
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

    if (ctx.Model === undefined) {
      msg.payload = ' triggered';
      logger.trace('msg.payload %s ', msg.payload);
    } else {
      msg.payload = ctx;
    }

    // msg.next = next;
    msg.ctx = JSON.parse(JSON.stringify(ctx));

    msg.next = function(msg) {
      // var updatedCtx = msg.ctx;
      var updatedCtx = JSON.parse(JSON.stringify(msg.ctx));

      Object.keys(updatedCtx).forEach(function(key) {
        ctx[key] = updatedCtx[key];
      });

      next();
    };

    _node.send(msg);
  };
};

module.exports = function(RED) {
  /**
   *
   * @param {*} Model Model
   * @param {*} id Id
   */
  function removeOldObservers(Model, id) {
    logger.trace('executing removeOldObservers');
    if (Model._observers === undefined)
      return;
    var observers = Model._observers;
    if (observers !== undefined && observers.length !== 0) {
      for (var j in observers) {
        if (observers.hasOwnProperty(j)) {
          var observer = observers[j];

          var nodeId;

          // hack to get nodeId.
          try {
            if (observer[0]) {
              nodeId = observer[0](null, null)();
              // console.log('node id received from Observer = ',
              // nodeId);
              if (nodeId === id) {
                // Id matched. remove this Observer
                // console.log('node id matched. removing this
                // Observer.');
                //  observers.splice(j, 1);
                // observers[j]=null;
                Model._observers[j] = [];
              }
            }
          } catch (e) {
            // var s = e;
          }
        }
      }
    }
  }

  /**
   *
   * @param {*} config Config
   */
  function UIObserver(config) {
    RED.nodes.createNode(this, config);
    logger.trace('executing UIObserver');
    var node = this;

    var SPAId = config.applicationName;
    var event = config.event;

    var Model = loopback.findModel("uiObserver");

    if (Model !== undefined) {
      // Remove existing observers if any.
      logger.trace('observers before removing = ', Model._observers);
      removeOldObservers(Model, node.id);
      logger.trace('observers after removing = ', Model._observers);

      Model.observe(event, new Observer(node, SPAId, event).observe);
    }

    node.on('close', function() {
      logger.trace('node is closing. removing observers');
      if (Model != undefined) {
        logger.trace('observers before removing = ', Model._observers);
        removeOldObservers(Model, node.id);
        logger.trace('observers after removing = ', Model._observers);
      }
    });
  }

  RED.nodes.registerType("ui-listener", UIObserver);
};
