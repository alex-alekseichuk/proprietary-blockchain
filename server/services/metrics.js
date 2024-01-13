'use strict';
const Counter = require('prom-client').Counter;
const Summary = require('prom-client').Summary;
var responseTime = require('response-time');
// const logger = require('log4js').getLogger('services.metrics');

/**
 * A Prometheus counter that counts the invocations of the different HTTP verbs
 * e.g. a GET and a POST call will be counted as 2 different calls
 */
const numOfRequests = new Counter({
  name: 'numOfRequests',
  help: 'Number of requests made',
  labelNames: ['method', 'path']
});

/**
 * A Prometheus counter for user operations like 
 * {
 *  operation:'new_user',
 *  user: 'user1'
 * }
 */
const person = new Counter({
  name: 'person',
  help: 'person',
  labelNames: ['operation', 'user']
});

/**
 * A Prometheus counter that counts the invocations with different paths
 * e.g. /foo and /bar will be counted as 2 different paths
 */
const pathsTaken = new Counter({
  name: 'pathsTaken',
  help: 'Paths taken in the app',
  labelNames: ['path']
});

/**
 * A Prometheus summary to record the HTTP method, path, response code and response time
 */
const responses = new Summary({
  name: 'responses',
  help: 'Response time in millis',
  labelNames: ['method', 'path', 'status']
});

/**
 * This function increments the counters that are executed on the request side of an invocation
 * Currently it increments the counters for numOfPaths and pathsTaken
 * @param {*} req  request object
 * @param {*} res  response object
 * @param {*} next next function
 */
const requestCounters = function(req, res, next) {
  if (req.path != '/metrics') {
    numOfRequests.inc({method: req.method, path: req.path});
    pathsTaken.inc({path: req.path});
  }
  next();
};

/**
 * This function increments the counters that are executed on the response side of an invocation
 * Currently it updates the responses summary
 */
const responseCounters = responseTime(function(req, res, time) {
  if (req.url != '/metrics') {
    responses.labels(req.method, req.url, res.statusCode).observe(time);
  }
});

module.exports = {
  responseCounters,
  requestCounters,
  responses,
  pathsTaken,
  numOfRequests,
  person
};
