/* eslint-disable no-console */
/* eslint-disable  require-jsdoc */ // This js program is obsulete. needs to be deleted
'use strict';

var fs = require('fs');

module.exports = generate;
function generate(configFile, flow, outputFile, smName) {
  return new Promise((resolve, reject) => {
    getConfig(configFile).then(configs => {
      console.log('getFile');
      return getFlow(configs, flow);
    }).then(flowConfigs => {
      console.log('generate json');
      return generateJson(flowConfigs, smName);
    }).then(json => {
      console.log('save json');
      return saveFile(outputFile, json);
    }).then(resolve).catch(reject);
  });
}

function generateJson(flowConfigs, smName) {
  return new Promise((resolve, reject) => {
    var ret = {
      appName: smName,
      appUi: {},
      appSM: {
        states: []
      }
    };

    var getByWire = function(wire) {
      return flowConfigs.find(c => {
        return c.id === wire;
      });
    };

    var getState = function(node) {
      if (ret.appSM.states.some(s => {
        return s.x === node.name;
      })) {
        return;
      }

      var nextStates = [];
      var xState = {
        x: node.name,
        ys: []
      };
      if (node.property) {
        try {
          var prop = JSON.parse(node.property);
          if (prop.pageUrl) {
            xState.ys.push({
              y: "showPage",
              activities: [
                {
                  type: "uiAction",
                  name: "",
                  actions: [
                    {
                      type: "uiAction",
                      name: "show-page",
                      parameters:
                      {
                        isStaticHtml: prop.isStaticHtml,
                        pageUrl: prop.pageUrl
                      }
                    }
                  ]
                }
              ]
            });
          }
        } catch (e) {
          console.error('Error on pars parameters:', e);
        }
      }

      node.rules.forEach((r, index) => {
        var yName = r.v;

        var yState = {
          y: yName,
          activities: []
        };

        node.wires[index].forEach(w => {
          var activity = getByWire(w);
          var activityStates = [];
          if (activity) {
            if (activity.type === "switch") {
              nextStates.push(activity);
              activityStates.push({
                type: "uiAction",
                name: "",
                actions: [
                  {
                    type: "uiAction",
                    name: "move-xy",
                    parameters:
                    {
                      x: activity.name,
                      y: "showPage"
                    }
                  }
                ]
              });
            }
            if (activity.type === "sm-ui-activity") {
              var activityState = {
                name: activity.name,
                type: "uiAction",
                actions: []
              };
              var moveCount = 0;
              activity.actions.forEach((action, index) => {
                var actionState = {
                  type: "uiAction",
                  name: action.name,
                  parameters: {}
                };
                if (action.parameters) {
                  try {
                    var params = JSON.parse(action.parameters);
                    actionState.parameters = params;
                  } catch (e) {
                    console.error("Error on parse uiaction parameters:", e);
                  }
                }
                if (actionState.name == "move-xy") {
                  var destId = activity.wires[moveCount][0];
                  var destY = flowConfigs.find(c => {
                    return c.id === destId;
                  });
                  var destX = flowConfigs.find(c => {
                    return c.type == "sm-x" &&
                      c.wires.some(wire => {
                        return wire.includes(destId);
                      });
                  });
                  actionState.parameters.x = destX.name;
                  actionState.parameters.y = destY.name;
                  moveCount++;
                }
                activityState.actions.push(actionState);
              });
              activityStates.push(activityState);
            }

            if (activity.type === "function") {
              var func = activity.func;

              activityStates.push({
                type: "server",
                name: "evalPayload",
                actions: [
                  {
                    type: "server",
                    name: "evalPayload",
                    parameters: {
                      func: func
                    }
                  }
                ]
              });
              if (activity.wires[0]) {
                activity.wires[0].forEach(w2 => {
                  var nActivity = getByWire(w2);
                  activityStates.push({
                    type: "uiAction",
                    name: "",
                    actions: [
                      {
                        type: "uiAction",
                        name: "move-xy",
                        parameters:
                        {
                          x: nActivity.name,
                          y: "showPage"
                        }
                      }
                    ]
                  });
                });
              }
            }
            if (activityStates.length > 0) {
              activityStates.forEach(activityState => {
                yState.activities.push(activityState);
              });
            }
          }
        });
        xState.ys.push(yState);
      });

      return {state: xState, nextStates: nextStates};
    };

    var runConvert = function(node) {
      var stateRes = getState(node);
      if (!stateRes)
        return;
      if (stateRes.state)
        ret.appSM.states.push(stateRes.state);
      if (stateRes.nextStates.length > 0)
        stateRes.nextStates.forEach(nextState => {
          runConvert(nextState);
        });
    };

    var entryPoint = flowConfigs.find(c => {
      return c.name === "entryPoint";
    });

    var firstX = getByWire(entryPoint.wires[0][0]);

    var entryPointState = {
      x: "entry_State",
      ys: [
        {
          y: "entry_Point",
          activities: [
            {
              type: "uiAction",
              name: "start",
              actions: [
                {
                  type: "uiAction",
                  name: "move-xy",
                  parameters: {
                    x: firstX.name,
                    y: "showPage"
                  }
                }
              ]
            }
          ]
        }
      ]
    };

    ret.appSM.states.push(entryPointState);

    runConvert(firstX);

    resolve([ret]);
  });
}

function getFlow(configs, flow) {
  return new Promise((resolve, reject) => {
    var tab = configs.find(c => {
      return c.label === flow;
    });
    if (!tab)
      return reject("Flow not found", flow);
    var flowConfigs = configs.filter(c => {
      return c.z === tab.id;
    });
    resolve(flowConfigs);
  });
}

function getConfig(configFile) {
  return new Promise((resolve, reject) => {
    getFile(configFile).then(text => {
      var config = JSON.parse(text);
      resolve(config);
    }).catch(err => {
      reject("Error on parse config", err);
    });
  });
}

function getFile(filePath) {
  return new Promise((resolve, reject) => {
    console.log(filePath);
    fs.readFile(filePath, 'utf-8', (err, text) => {
      // console.log('file readed', err, text);
      if (err) {
        console.error(err);
        return reject(err);
      }
      return resolve(text);
    });
  });
}

function saveFile(outputFile, json) {
  return new Promise((resolve, reject) => {
    var content = JSON.stringify(json);
    fs.writeFile(outputFile, content, err => {
      if (err) return reject("Error on save file", err);
      return resolve();
    });
  });
}
