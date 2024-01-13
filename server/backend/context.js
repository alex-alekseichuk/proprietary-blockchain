/**
 * Context implementation by Continuation-Local Storage (Hooked)
 * https://www.npmjs.com/package/cls-hooked
 * On each HTTP request we create the namespace/scope unique for this HTTP request.
 * Such a context available via global _ctx.
 * TODO: it needs to create a namespace and init the context on rabbit-mq message
 */
/* eslint no-unused-vars: ["error", { "vars": "local" }] */
"use strict";
var logger = require("log4js").getLogger("backend.context");
const createNamespace = require("cls-hooked").createNamespace;

const _context = createNamespace("core");

const get = contextKey => {
  return _context.get(contextKey);
};

const set = (key, value) => {
  try {
    _context.set(key, value);
  } catch (error) {
    logger.error("Couldn't set the context!");
    throw error;
  }
};

const getAll = () => {
  return {
    user: _context.get("user"),
    requestId: _context.get("requestId"),
    sessionId: _context.get("sessionId"),
    clientId: _context.get("clientId")
  };
};

const scope = (handler, contextInitValues) => {
  _context.run(() => {
    if (contextInitValues) {
      for (const [key, value] of Object.entries(contextInitValues)) {
        _context.set(key, value);
      }
    }
    try {
      handler();
    } catch (err) {
      logger.error(err);
    }
  });
};

const scopePromise = (handler, contextInitValues) => {
  return _context.runPromise(() => {
    if (contextInitValues) {
      for (const [key, value] of Object.entries(contextInitValues)) {
        _context.set(key, value);
      }
    }
    try {
      return handler();
    } catch (err) {
      logger.error(err.message);
      return Promise.reject(err);
    }
  });
};

const _ctx = {
  get,
  set,
  getAll,
  scope,
  scopePromise
};
global._ctx = _ctx;

module.exports = _ctx;
_ctx.__components = "context";
