'use strict';

/* eslint-disable complexity */
/* eslint-disable require-jsdoc */ // code is obsulete
const logger = require('log4js').getLogger('state-machine-actions-executor.js');
const vm = require('vm');

function getExecuter(loopback, payload, id) {
  return {
    execute: function(action) {
      var variables = calculateVariables(action);
      var paramsCalculated = parametersCalculate(action.parameters, variables);
      logger.trace(variables);
      logger.trace(paramsCalculated);
      logger.debug("Action name : %s", action.name);

      switch (action.name) {
        case "getData":
          return getAllData(action);
        case "getAllData":
          return getAllDataFromDB(action);
        case "nodered":
          return nodered(action);
        case "addItem":
          return create(action, payload.data, paramsCalculated);
        case "update":
          return update(action, payload.data, paramsCalculated);
        case "delete":
          return remove(action, payload.data, paramsCalculated);
        case "findOne":
          return getByModelId(action, variables);
        case "findOneFromUIObject":
          return getByModelFromUIObject(action, payload);
        case "search":
          return search(action, payload, paramsCalculated);
        case "getUiObject":
          return getUiOject(action, payload, paramsCalculated);
        case "evalPayload":
          return evalPayload(action, payload);
        default:
      }

      function _noModel(modelName) {
        const msg = `No ${modelName} model`;
        logger.error(msg);
        return Promise.reject(new Error(msg));
      }

      function calculateVariables(action) {
        const result = {};
        if (action.variables) {
          action.variables.forEach(function(variable) {
            if (variable.type === "fromPayload") {
              result[variable.name] = payload[variable.options.payloadField];
            }
          });
        }
        return result;
      }

      function parametersCalculate(parameters, variables) {
        return processItem(parameters, variables);
      }

      function processItem(item, variables) {
        Object.keys(item).forEach(function(subItem) {
          if (typeof item[subItem] === 'object') {
            item[subItem] = processItem(item[subItem], variables);
          } else if (item[subItem]) {
            if (item[subItem][0] == "$") {
              item[subItem] = variables[item[subItem]];
            }
          }
        });
        return item;
      }

      function getByModelId(action, variables) {
        const model = loopback.models[action.parameters.modelName];
        if (!model)
          return _noModel(action.parameters.modelName);
        const id = variables.$id;
        logger.trace("id:", id);
        action.parameters.query.where.id = id;
        return model.find(action.parameters.query).then(function(data) {
          payload.data = data[0];
          return data;
        });
      }

      function getByModelFromUIObject(action, payload, variables) {
        const model = loopback.models.uiObjects;
        logger.debug('UiObject : %s', payload.uiObject);
        return model.find({
          where: {
            uiObjectName: payload.uiObject
          }
        })
          .then(rc => {
            logger.trace('UiObject : %s found', payload.uiObject);
            if (rc && rc.length > 0) {
              payload.data = rc[0].uiObject;
              return rc[0].uiObject;
            }
            return {};
          })
          .catch(() => {
            logger.trace('UiObject : %s not found', payload.uiObject);
            return {};
          });
      }

      function getAllData(action) {
        logger.debug(`getAllData model ${action.parameters.modelName}`);
        const model = loopback.models[action.parameters.modelName];
        if (!model) {
          logger.error(`No model ${action.parameters.modelName}`);
          return _noModel(action.parameters.modelName);
        }
        return model.find(action.parameters.query).then(function(data) {
          payload.data = data;
          return data;
        });
      }

      function getAllDataFromDB(action) {
        const model = loopback.models[action.parameters.modelName];
        if (!model)
          return _noModel(action.parameters.modelName);
        return model.find().then(function(data) {
          payload.data = data;
          return data;
        });
      }

      function nodered(action, id) {
        const model = loopback.models.uiObserver;
        if (!payload.data)
          payload.data = {};
        return model.notifyObserversOf(action.parameters.id + "_" + action.parameters.event, payload.data).then(function(ctx) {
          payload.data = ctx;
          if (ctx.variant) {
            payload.variant = ctx.variant;
          } else {
            payload.variant = "OK";
          }
          return ctx;
        });
      }

      function create(action, payload, paramsCalculated) {
        const modelName = paramsCalculated.modelName;
        const model = loopback.models[modelName];
        if (!model)
          return _noModel(modelName);
        payload.id = null;
        return model.create(payload).then(function(data) {
          payload.data = data;
          return data;
        });
      }

      function update(action, payload, paramsCalculated) {
        const modelName = paramsCalculated.modelName;
        const model = loopback.models[modelName];
        if (!model)
          return _noModel(modelName);
        return model.upsert(payload).then(function(data) {
          payload.data = data;
          return data;
        });
      }

      function remove(action, payload, paramsCalculated) {
        const modelName = paramsCalculated.modelName;
        const model = loopback.models[modelName];
        if (!model)
          return _noModel(modelName);
        return model.destroyById(paramsCalculated.id);
      }

      function search(action, payload, paramsCalculated) {
        const modelUiObject = loopback.models.uiObjects;
        const modelName = paramsCalculated.modelName;
        const model = loopback.models[modelName];
        if (!model)
          return _noModel(modelName);
        let uiObject = {};
        const query = {};
        query.where = {};
        query.where.or = [];

        return modelUiObject.find({
          where: {
            uiObjectName: paramsCalculated.uiObject
          }
        })
          .then(rc => {
            if (rc && rc.length > 0) {
              uiObject = rc[0].uiObject;
              uiObject.searchByFields.forEach(function(field) {
                var likeSearch = {};
                likeSearch[field] = {};
                likeSearch[field].like = paramsCalculated.text;
                query.where.or.push(likeSearch);
              });
              return model.find(query).then(function(data) {
                payload.data = data;
                return data;
              });
            }
            return {};
          })
          .catch(() => {
            return {};
          });
      }

      function getUiOject(action, payload, paramsCalculated) {
        const modelUiObject = loopback.models.uiObjects;
        return modelUiObject.find({
          where: {
            uiObjectName: action.parameters.uiObjectName
          }
        })
          .then(rc => {
            if (rc && rc.length > 0) {
              payload.data = rc[0].uiObject;
              return rc[0].uiObject;
            }
            return {};
          });
      }

      function evalPayload(action, payload) {
        try {
          const func = action.parameters.func;
          const script = new vm.Script(func);
          const CreateContext = vm.createContext;
          const context = new CreateContext({msg: {payload: payload}});
          script.runInContext(context);
          return Promise.resolve(payload);
        } catch (e) {
          logger.error(e.message);
          return Promise.reject(e);
        }
      }
    }
  };
}
module.exports = {
  getExecuter: getExecuter
};
