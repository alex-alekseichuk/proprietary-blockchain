'use strict';

const testCallback = (callback, body) => {
  return new Promise((resolve, reject) => {
    let status;
    let json;
    let message;
    let req = {
      body: body
    };
    let res = {
      status: stat => {
        status = stat;
        return res;
      },
      end: () => {
        reject({
          status: status,
          json: json,
          message: message
        });
      },
      json: d => {
        json = d;
        return res;
      },
      send: d => {
        message = d;
        return res.end();
      }
    };
    callback(req, res, data => {
      if (data)
        return reject(data);
      resolve();
    });
  });
};

class Router {
  constructor() {
    this._getRoutes = {};
    this._postRoutes = {};
  }

  addGet() {
    let url = arguments[0];
    if (!url || typeof url !== 'string')
      return;
    let middlewares = [];
    for (var i = 1; i < arguments.length; i++) {
      let middlewareCallback = arguments[i];
      if (typeof middlewareCallback === 'function')
        middlewares.push(middlewareCallback);
    }
    this._getRoutes[url] = middlewares;
  }

  addPost() {
    let url = arguments[0];
    if (!url || typeof url !== 'string')
      return;
    let middlewares = [];
    for (var i = 1; i < arguments.length; i++) {
      let middlewareCallback = arguments[i];
      if (typeof middlewareCallback === 'function')
        middlewares.push(middlewareCallback);
    }
    this._postRoutes[url] = middlewares;
  }

  runGet(url) {
    let middlewares = this._getRoutes[url];
    if (!middlewares)
      return Promise.reject('No get route', url);
    return Promise.all(middlewares.map(m => testCallback(m)));
  }

  runPost(url, body) {
    let middlewares = this._postRoutes[url];
    if (!middlewares)
      return Promise.reject('No post route', url);
    return Promise.all(middlewares.map(m => testCallback(m, body)));
  }

  hasGetRoute(url) {
    return this._getRoutes[url] !== undefined;
  }

  hasPostRoute(url) {
    return this._postRoutes[url] !== undefined;
  }
}

module.exports = Router;
