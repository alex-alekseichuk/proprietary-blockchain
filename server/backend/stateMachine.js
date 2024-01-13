/**
 * Created by mac on 29.06.16.
 */
'use strict';

var async = require('async');
var logger = require('log4js').getLogger('stateMachneNew.js');
var actionExecuter = require('./stateMachineActionsExecuter');

var StatsD = require('hot-shots');
var client = new StatsD({
  host: (process.env.ngrtStatsdHost),
  port: (process.env.ngrtStatsdPort),
  errorHandler: error => logger.error('StatsD exception:', error.message)
});

logger.debug('Executing state-machne-new.js ');

client.socket.on('error', function(error) {
  logger.error("Statsd error %s", error);
});

var trackPairActions = ["createNewItem", "doInsertItem"];

var startTrack = false;

/**
 *
 * @param {*} id id
 * @param {*} done done
 * @param {*} loopback loopback
 */
function initSM(id, done, loopback) {
  var model = loopback.models.statemachineApp;
  model.find({
    where: {
      appName: id
    }
  }, function(err, rc) {
    if (err) {
      done({});
    }

    if (rc && rc.length > 0) {
      done(rc[0].appUi);
    } else {
      done({});
    }
  });
}

/**
 *
 * @param {*} id id
 * @param {*} x x
 * @param {*} y y
 * @param {*} payload payload
 * @param {*} loopback loopback
 * @param {*} done done
 */
function executeAction(id, x, y, payload, loopback, done) {
  if (!payload) {
    payload = {};
  }

  if (!payload.data) {
    payload.variant = {};
  }

  if (y == "entry_Point") {
    client.increment('stateMachine, y=entry');
  }

  if (startTrack) {
    if (y == trackPairActions[1]) {
      startTrack = false;
    }
  } else
  if (y == trackPairActions[0]) {
    startTrack = true;
  }

  var _actionExecuter = actionExecuter.getExecuter(loopback, payload, id);
  var _clientActions = []; // TEMP clientActions;
  var clientActions = []; // Answers to client
  var serverSideActivities = []; // Will be done first

  var applicationModel = {};
  var model = loopback.models.statemachineApp;
  model.find({
    where: {
      appName: id
    }
  }, function(err, rc) {
    if (err) {
      done({});
    }

    if (rc && rc.length > 0) {
      applicationModel = rc[0].appSM;

      var response = {};

      // Looking for correct state according to sended x and y
      applicationModel.states.forEach(function(_x) {
        if (_x.x === x) {
          _x.ys.forEach(function(_y) {
            if (_y.y === y) {
              _y.activities.forEach(function(activity) {
                if (activity.type) {
                  if (activity.type === "server") {
                    serverSideActivities.push(activity);
                  } else {
                    activity.actions.forEach(action => {
                      _clientActions.push(action);
                    });
                  }
                }
              });
            }
          });
        }
      });

      async.series([
        // Processing serverSide actions
        function processServerSideActivity(next) {
          // Processing serverSide handlers
          payload.variant = "OK";
          async.eachSeries(serverSideActivities, function(activity, itemDone) {
            var _ActivityClientSideActions = [];
            async.eachSeries(activity.actions, function(action, actionDone) {
              if (action.type === "server") {
                _actionExecuter.execute(action).then(data => {
                  actionDone();
                }).catch(err => {
                  payload.variant = "ERROR";
                  actionDone(err);
                });
              } else {
                _ActivityClientSideActions.push(action);
                _ActivityClientSideActions.forEach(action => {
                  clientActions.push(action);
                });
                actionDone();
              }
            }, function(err) {
              if (activity.variants) {
                // Some of activity actions went wrong
                async.eachSeries(activity.variants, (variant, variantDone) => {
                  if (variant.name === payload.variant) {
                    async.eachSeries(variant.actions, (action, actionDone) => {
                      if (action.type === "server") {
                        _actionExecuter.execute(action).catch(err => {
                          actionDone(err);
                        }).then(() => {
                          actionDone();
                        });
                      } else {
                        clientActions.push(action);
                        actionDone();
                      }
                    }, err => {
                      if (err) {
                        variantDone(err);
                      } else {
                        variantDone();
                      }
                    });
                  } else {
                    variantDone();
                  }
                }, err => {
                  itemDone();
                });
              } else {
                itemDone();
              }
            });
          }, function(err) {
            next();
          });
        },

        // Processing clientSideActions
        function processClientSideActivity(next) {
          _clientActions.forEach(action => {
            clientActions.push(action);
          });
          next();
        }
      ], function(err) {
        response.actions = clientActions;
        response.payload = payload;
        done(response);
      });
    }
  });
}

module.exports = {
  executeAction: executeAction,
  initSM: initSM
};
