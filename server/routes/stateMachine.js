'use strict';

var SMnew = require('../backend/stateMachine');

/**
 * API/Route/stateachine
 *
 * @module API/Route/stateachine
 * @type {Object}
 */

module.exports = server => {
  server.get('/state-machine/init', function(req, res) {
    SMnew.initSM(req.query.id, function(data) {
      res.send(data);
    }, req.app);
  });

  server.get('/application/:applicationName', function(req, res) {
    var applicationName = req.params.applicationName;
    var applicationParams = {
      applicationName: applicationName,
      modelId: req.query.modelId,
      modelName: req.query.modelName,
      uiObject: req.query.uiObject
    };

    res.render('routes/applications/application.ejs', {applicationParams: applicationParams});
  });

  server.post('/state-machine-new/action', function(req, res) {
    if (req.body.modelId && !req.body.uiObject) {
      req.body.x = "modelId";
      req.body.y = "getModel";
      req.body.payload = {
        id: req.body.modelId
      };

      SMnew.executeAction(req.body.id, req.body.x, req.body.y, req.body.payload, req.app, function(resp) {
        res.send(resp);
      });
    }
    if (req.body.modelName && req.body.uiObject) {
      if (req.body.x === "entry_State" && req.body.y === "entry_Point") {
        req.body.x = "modelId";
        req.body.y = "getModel";
      }
      req.body.id = "sm-new-uiObject";
      if (req.body.payload) {
        req.body.payload.modelName = req.body.modelName;
        req.body.payload.uiObject = req.body.uiObject;
      } else {
        req.body.payload = {
          modelName: req.body.modelName,
          uiObject: req.body.uiObject
        };
      }

      SMnew.executeAction(req.body.id, req.body.x, req.body.y, req.body.payload, req.app, function(resp) {
        res.send(resp);
      });
    } else {
      SMnew.executeAction(req.body.id, req.body.x, req.body.y, req.body.payload, req.app, function(resp) {
        res.send(resp);
      });
    }
  });
};
