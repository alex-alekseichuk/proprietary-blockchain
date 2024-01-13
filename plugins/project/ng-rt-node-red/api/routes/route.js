"use strict";

const logger = require('log4js').getLogger('ng-rt-node-red.services');
const express = require('express');
const http = require("http");
var RED = require('node-red');
const clone = require("clone");
const path = require('path');
const fs = require('fs-extra');
const BearerStrategy = require('passport-http-bearer').Strategy;
const request = require('request');
const EventEmitter = require('events').EventEmitter;

let i18n;
/* eslint-disable */
/**
 * API/Service/red
 *
 * @module API/Service/red
 * @type {object}
 */

module.exports = {
  /**
   * activate ng-rt-node-red plugin routes and service
   * @param {object} server - loopback app instance
   * @param {string} plugin - plugin name
   * @return {object} result
   */
  activate: (server, plugin) => {
    const services = server.plugin_manager.services;
    const configService = services.get("configService");
    const rabbitMQ = services.get('rabbitMQ');
    i18n = services.get('i18n');
    const app = express();
    let events = new EventEmitter();

    // Create a server
    let server2 = http.createServer(app);
    let watcherStarted = false;

    const nodeRedPluginPath = path.resolve(server.plugin_manager.configs.data('ng-rt-node-red').path.absolute, "nodered");
    createFolder(nodeRedPluginPath);

    const pluginSettings = server.plugin_manager.configs.get(plugin);

    delete require.cache[require.resolve('./authenticate/')];
    let adminAuth = require('./authenticate/')(server, pluginSettings);

    let flows;
    let lastUpdate;
    // Create the settings object - see default settings.js file for other
    // options
    let settings;
    let options;
    if (options && options.settings) {
      settings = options.settings;
    } else {
      settings = {
        httpAdminRoot: '/red/',
        httpNodeRoot: '/redapi',
        userDir: nodeRedPluginPath,
        nodesDir: '../nodes',
        logging: {
          console: {
            level: pluginSettings.get("node-red.logging"),
            metrics: false,
            audit: false
          }
        },
        functionGlobalContext: {
          querystring: require("querystring"),
          crypto: require("crypto")
        },
        adminAuth: adminAuth,
        credentialSecret: pluginSettings.get('node-red.secret')
      };

      if (pluginSettings.get("node-red.audit") === true)
        settings.logging.console.audit = true;
      if (pluginSettings.get("node-red.metrics") === true)
        settings.logging.console.metrics = true;

      if (server.datasources.ng_rt_node_red) {
        delete require.cache[require.resolve("../storage/storage")];
        settings.storageModule = require("../storage/storage")(server, i18n, events);
      } else {
        settings.flowFile = 'node-red-flows.json';
      }
    }

    // Initialise the runtime with a server and settings
    logger.trace(i18n.__("init Node-Red server", settings));
    RED.init(server2, settings);
    let passportChanged = false;
    RED.httpAdmin.use((res, req, next) => {
      if (passportChanged)
        return next();
      passportChanged = true;
      logger.debug("first use");
      res._passport.instance.unuse('bearer');
      res._passport.instance.use('bearer', new BearerStrategy('bearer', (accessToken, done) => {
        logger.debug('bearer verify', accessToken);
        RED.settings.storageModule.getSessions().then(sessions => {
          if (!sessions) {
            return done(null, false);
          }
          let session = sessions[accessToken];
          if (!session)
            return done(null, false);
          done(null, { username: session.user, permissions: "*" }, { scope: ["*"] });
        });
      }));
      next();
    });

    function handleFlowsUpdated() {
      rabbitMQ.publishFanout('NODE_RED_FLOWS_UPDATED', {
        updated: new Date()
      });
    }

    /**
     * Server start from api and nodered
     */
    function startServer() {
      // Serve the editor UI from /red
      app.use(settings.httpAdminRoot, RED.httpAdmin);

      // Serve the http nodes UI from /api
      app.use(settings.httpNodeRoot, RED.httpNode);

      const port = configService.get("nodeRedPort");

      server2.listen(port).on('error', () => {
        logger.error(i18n.__('Node-Red port %s already in use ', port));
        process.exit(1);
      });

      events.on('NODE_RED_FLOWS_UPDATED', handleFlowsUpdated);
    }

    function nodeRedFlowsUpdatedHandler(message) {
      lastUpdate = new Date();
      setTimeout(() => {
        if (watcherStarted && lastUpdate && new Date() - lastUpdate > 999) {
          lastUpdate = null;
          let service = services.get('RED');
          if (service) {
            logger.info(i18n.__('Restart node-red service by watcher'));
            RED.nodes.loadFlows(true);
          }
        }
      }, 1000);
    }

    startServer();

    let nodeRedService = {
      /**
       * control flows
       */
      flows: {
        /**
         * add flow
         * @param {object} flow - flow obbject to add
         * @param {boolean} replace - if true replace flow if exist with same id
         * @return {Promise} result
         */
        add: async (flow, replace) => {
          if (flow.id) {
            const configs = RED.nodes.getFlows();
            const newConfig = await addFlow(configs.flows, flow, replace);
            return await RED.nodes.setFlows(newConfig);
          }
          return await RED.nodes.addFlow(flow);
        },
        /**
         * remove flow
         * @param {object} flow - flow to remove
         * @return {object} result
         */
        remove: flow => {
          return RED.nodes.removeFlow(flow);
        }
      },
      subflows: {
        /**
         * add subflow
         * @param {object} subflow - subflow object to add
         * @return {Promise} result
         */
        add: async subflow => {
          if (subflow) {
            const host = configService.get("internalDNSName");
            const port = configService.get("nodeRedPort");
            const url = `${host}:${port}`;
            const authorizeOptions = {
              username: pluginSettings.get("node-red.username"),
              password: pluginSettings.get("node-red.pass"),
              url
            };
            const token = await authorizeRed(authorizeOptions);
            const globalFlows = await getGlobalFlow({ url, token });
            if (!globalFlows.subflows) globalFlows.subflows = [];
            const globalSubflows = globalFlows.subflows;
            let indexSubflowId;
            if (globalSubflows.length === 0) {
              indexSubflowId = -1;
            } else {
              indexSubflowId = globalSubflows.findIndex(el => el.id === subflow.id);
            }
            if (indexSubflowId === -1) {
              globalSubflows.push(subflow);
            } else {
              globalSubflows[indexSubflowId] = subflow;
            }
            return await putGlobalFlow({ url, token }, globalFlows);
          }
          return null;
        },
        /**
         * remove subflow
         * @param {object} subflowId - subflow id to remove
         * @return {Promise} result
         */
        remove: async subflowId => {
          if (subflowId) {
            const host = configService.get("internalDNSName");
            const port = configService.get("nodeRedPort");
            const url = `${host}:${port}`;
            const authorizeOptions = {
              username: pluginSettings.get("node-red.username"),
              password: pluginSettings.get("node-red.pass"),
              url
            };
            const token = await authorizeRed(authorizeOptions);
            const globalFlows = await getGlobalFlow({ url, token });
            if (!globalFlows.subflows) return null;
            const globalSubflows = globalFlows.subflows;
            const indexSubflowId = globalSubflows.findIndex(el => el.id === subflowId);
            if (indexSubflowId !== -1) {
              globalSubflows.splice(indexSubflowId, 1);
            }
            return await putGlobalFlow({ url, token }, globalFlows);
          }
          return null;
        }
      },
      /**
       * control nodes
       */
      nodes: {
        /**
         * install node-red module
         * @param {string} path - path to folder with module
         * @param {string} version - version number
         */
        installModule: RED.nodes.installModule,
        /**
         * uninstall node-red module
         * @param {string} name - name of module
         */
        uninstallModule: RED.nodes.uninstallModule,
        /**
         * start flows
         */
        startFlows: RED.nodes.startFlows,
        /**
         * stop flows
         */
        stopFlows: RED.nodes.stopFlows
      },
      /**
       * start node-red service flows
       */
      start: RED.start,
      /**
       * stop node-red service flows
       */
      stop: RED.stop,
      /**
       * stop node-red service and close server instance
       */
      close: () => {
        RED.stop();
        server2.close();
      },
      /**
       * restart service
       * @return {Promise} result - empty
       */
      restart: () => {
        return new Promise((resolve, reject) => {
          RED.stop();
          server2.close();
          server2 = http.createServer(app);
          delete require.cache[require("node-red")];
          RED = require("node-red");
          // RED.init(server2, settings);
          startServer();
          RED.start();
          resolve();
        });
      },
      /**
       * start watch to changes in node-red flows
       */
      startWatch: () => {
        logger.trace(i18n.__("starting watch"));
        if (!watcherStarted) {
          rabbitMQ.subscribeToFanoutExchange("NODE_RED_FLOWS_UPDATED", nodeRedFlowsUpdatedHandler, () => {
            watcherStarted = true;
          });
        }
      },
      /**
       * stop watch to changed in node-red flows
       */
      stopWatch: () => {
        logger.trace(i18n.__("stop watch"));
        if (watcherStarted) {
          watcherStarted = false;
          rabbitMQ.unsubscribeFromFanout('NODE_RED_FLOWS_UPDATED', nodeRedFlowsUpdatedHandler);
        } else
          watcherStarted = false;
      },
      /**
       * node-red instance
       */
      RED: RED
    };

    services.add("RED", nodeRedService);
    nodeRedService.startWatch();
    // Start the runtime
    return RED.start();
  },
  /**
   * deactivate ng-rt-node-red plugin reoutes and service
   * @param {object} server - loopback app instance
   */
  deactivate: server => {
    const services = server.plugin_manager.services;
    let redService = services.get("RED");
    if (redService)
      redService.close();
    services.remove("RED");
  }
};

/**
 * create folder if not exist
 * @param {string} folder - folder name
 */
function createFolder(folder) {
  try {
    fs.lstatSync(folder);
  } catch (e) {
    fs.mkdirSync(folder);
  }
}

/**
 * add flows to specfic object
 * @param {object} config - specific node-red config object
 * @param {object} flow - flow object to add
 * @param {boolean} replace - if true replace flow if exist
 * @return {Promise} result - new node-red specific config
 */
function addFlow(config, flow, replace) {
  var i;
  var node;
  if (!flow.hasOwnProperty('nodes')) {
    throw new Error(i18n.__('missing nodes property'));
  }
  var duplicate = config.find(fl => {
    return fl.id === flow.id;
  });
  if (duplicate) {
    logger.debug(i18n.__("duplicate replace", replace === true));
    // has to be edited
    if (!replace)
      return Promise.reject(new Error(i18n.__("Duplicate id")));
    var index = config.indexOf(duplicate);
    config.splice(index, 1);
  }
  let rootNode = {
    type: flow.type,
    label: flow.label || flow.name,
    id: flow.id
  };

  if (flow._id)
    rootNode._id = flow._id;
  if (flow.in)
    rootNode.in = flow.in;
  if (flow.out)
    rootNode.out = flow.out;
  if (flow.name)
    rootNode.name = flow.name;

  var nodes = [rootNode];

  let duplicateNodesFn = fl => {
    return fl.id === node.id;
  };
  for (i = 0; i < flow.nodes.length; i++) {
    node = flow.nodes[i];
    let duplicateNodes = config.find(duplicateNodesFn);
    if (duplicateNodes) {
      // has to be edited
      let index = config.indexOf(duplicateNodes);
      config.splice(index, 1);
    }
    if (node.type === 'tab' || node.type === 'subflow') {
      return Promise.reject(new Error('invalid node type: ' + node.type));
    }
    node.z = flow.id;
    nodes.push(node);
  }
  if (flow.configs) {
    for (i = 0; i < flow.configs.length; i++) {
      node = flow.configs[i];
      var duplicateNodes = config.find(duplicateNodesFn);
      if (duplicateNodes) {
        // has to be edited
        let index = config.indexOf(duplicateNodes);
        config.splice(index, 1);
      }
      if (node.type === 'tab' || node.type === 'subflow') {
        return Promise.reject(new Error('invalid node type: ' + node.type));
      }
      node.z = flow.id;
      nodes.push(node);
    }
  }
  var newConfig = clone(config);
  newConfig = newConfig.concat(nodes);

  return Promise.resolve(newConfig);
}
/**
 * 
 * @param {object} options - request options as parameter
 */
function getGlobalFlow(options) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: 'GET',
      uri: `${options.url}/red/flow/global`,
      headers: {
        Authorization: options.token
      }
    };
    request(requestOptions, (error, response, body) => {
      if (error) {
        return reject(error);
      }
      if (response.statusCode !== 200) {
        return reject(body);
      }
      try {
        body = JSON.parse(body);
        return resolve(body);
      } catch (e) {
        return reject(e);
      }
    });
  });
}
/**
 * 
 * @param {object} options - request options as parameter
 * @param {object} globalFlow - globalflow value as parameter
 */
function putGlobalFlow(options, globalFlow) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: 'PUT',
      uri: `${options.url}/red/flow/global`,
      body: JSON.stringify(globalFlow),
      headers: {
        'Authorization': options.token,
        'content-type': 'application/json'
      }
    };
    request(requestOptions, (error, response, body) => {
      if (error) {
        return reject(error);
      }
      if (response.statusCode !== 200) {
        return reject(body);
      }
      return resolve(null);
    });
  });
}
/**
 * 
 * @param {object} options - request options as parameter
 */
function authorizeRed(options) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: 'POST',
      uri: `${options.url}/red/auth/token`,
      headers: {
        'Content-type': 'application/x-www-form-urlencoded'
      },
      body: `client_id=node-red-admin&grant_type=password&scope=*&username=${options.username}&password=${options.password}`
    };
    request(requestOptions, (error, response, body) => {
      if (error) {
        return reject(error);
      }
      if (response.statusCode !== 200) {
        return reject(body);
      }
      try {
        body = JSON.parse(body);
        return resolve(`${body.token_type} ${body.access_token}`);
      } catch (e) {
        return reject(e);
      }
    });
  });
}
