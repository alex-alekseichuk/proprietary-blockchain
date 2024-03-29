/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
/* eslint-disable complexity */

'use strict';
module.exports = function(RED) {
	var bodyParser = require('body-parser');
	var cookieParser = require('cookie-parser');
	var getBody = require('raw-body');
	var cors = require('cors');
	var jsonParser = bodyParser.json();
	var urlencParser = bodyParser.urlencoded({ extended: true });
	var onHeaders = require('on-headers');
	var typer = require('media-typer');
	var isUtf8 = require('is-utf8');

	const logger = require('log4js').getLogger('node-red io block');
	/**
   *
   * @param {*} req Request
   * @param {*} res Respons
   * @param {*} next Callback
   * @return {*} next Callback
   */
	function rawBodyParser(req, res, next) {
		if (req.skipRawBodyParser) {
			next();
		} // don't parse this if told to skip
		if (req._body) {
			return next();
		}
		req.body = '';
		req._body = true;

		var isText = true;
		var checkUTF = false;

		if (req.headers['content-type']) {
			var parsedType = typer.parse(req.headers['content-type']);
			if (parsedType.type === 'text') {
				isText = true;
			} else if (parsedType.subtype === 'xml' || parsedType.suffix === 'xml') {
				isText = true;
			} else if (parsedType.type !== 'application') {
				isText = false;
				// eslint-disable-next-line no-negated-condition
			} else if (parsedType.subtype !== 'octet-stream') {
				checkUTF = true;
			} else {
				// applicatino/octet-stream
				isText = false;
			}
		}

		getBody(
			req,
			{
				length: req.headers['content-length'],
				encoding: isText ? 'utf8' : null
			},
			function(err, buf) {
				if (err) {
					return next(err);
				}
				if (!isText && checkUTF && isUtf8(buf)) {
					buf = buf.toString();
				}
				req.body = buf;
				next();
			}
		);
	}

	/**
   *
   * @param {*} node Node
   * @param {*} res Response
   * @return {*} res Result
   */
	function createResponseWrapper(node, res) {
		var wrapper = {
			_res: res
		};
		var toWrap = [
			'append',
			'attachment',
			'cookie',
			'clearCookie',
			'download',
			'end',
			'format',
			'get',
			'json',
			'jsonp',
			'links',
			'location',
			'redirect',
			'render',
			'send',
			'sendfile',
			'sendFile',
			'sendStatus',
			'set',
			'status',
			'type',
			'vary'
		];
		toWrap.forEach(function(f) {
			wrapper[f] = function() {
				node.warn(RED._('httpin.errors.deprecated-call', { method: 'msg.res.' + f }));
				var result = res[f].apply(res, arguments);
				if (result === res) {
					return wrapper;
				}
				return result;
			};
		});
		return wrapper;
	}

	var corsHandler = function(req, res, next) {
		next();
	};

	if (RED.settings.httpNodeCors) {
		corsHandler = cors(RED.settings.httpNodeCors);
		RED.httpNode.options('*', corsHandler);
	}

	/**
   *
   * @param {*} n n
   */
	function HTTPIn(n) {
		RED.nodes.createNode(this, n);
		// eslint-disable-next-line no-negated-condition
		if (RED.settings.httpNodeRoot !== false) {
			if (!n.url) {
				this.warn(RED._('httpin.errors.missing-path'));
				return;
			}
			this.url = n.url;
			this.method = n.method;
			this.swaggerDoc = n.swaggerDoc;

			var node = this;

			this.errorHandler = function(err, req, res, next) {
				node.warn(err);
				res.sendStatus(500);
			};

			this.callback = function(req, res) {
				var msgid = RED.util.generateId();
				res._msgid = msgid;

				if (node.method.match(/^(post|delete|put|options|patch)$/)) {
					node.send({ _msgid: msgid, req: req, res: createResponseWrapper(node, res), payload: req.body });
				} else if (node.method == 'get') {
					let msg = { _msgid: msgid, req: req, res: createResponseWrapper(node, res), payload: req.query };

					msg.args = req.query.args.split('@');
					// msg.args = req.query.args.split("@").map(arg => decodeURIComponent(arg));
					msg.env = JSON.parse(req.query.env);
					msg.memory = req.query.world_memory ? JSON.parse(req.query.world_memory) : {};
					msg.transferData = req.query.transferData ? JSON.parse(req.query.transferData) : null;
					msg.changeAsset = {};

					logger.debug('HTTP IN msg.args:');
					logger.debug(msg.args);
					logger.debug('HTTP IN msg.memory:');
					logger.debug(msg.memory);

					node.send(msg);
				} else {
					node.send({ _msgid: msgid, req: req, res: createResponseWrapper(node, res) });
				}
			};

			var httpMiddleware = function(req, res, next) {
				next();
			};

			if (RED.settings.httpNodeMiddleware) {
				if (typeof RED.settings.httpNodeMiddleware === 'function') {
					httpMiddleware = RED.settings.httpNodeMiddleware;
				}
			}

			var metricsHandler = function(req, res, next) {
				next();
			};
			if (this.metric()) {
				metricsHandler = function(req, res, next) {
					var startAt = process.hrtime();
					onHeaders(res, function() {
						if (res._msgid) {
							var diff = process.hrtime(startAt);
							var ms = diff[0] * 1e3 + diff[1] * 1e-6;
							var metricResponseTime = ms.toFixed(3);
							var metricContentLength = res._headers['content-length'];
							// assuming that _id has been set for res._metrics in HttpOut node!
							node.metric('response.time.millis', { _msgid: res._msgid }, metricResponseTime);
							node.metric('response.content-length.bytes', { _msgid: res._msgid }, metricContentLength);
						}
					});
					next();
				};
			}

			if (this.method == 'get') {
				RED.httpNode.get(
					this.url,
					cookieParser(),
					httpMiddleware,
					corsHandler,
					metricsHandler,
					this.callback,
					this.errorHandler
				);
			} else if (this.method == 'post') {
				RED.httpNode.post(
					this.url,
					cookieParser(),
					httpMiddleware,
					corsHandler,
					metricsHandler,
					jsonParser,
					urlencParser,
					rawBodyParser,
					this.callback,
					this.errorHandler
				);
			} else if (this.method == 'put') {
				RED.httpNode.put(
					this.url,
					cookieParser(),
					httpMiddleware,
					corsHandler,
					metricsHandler,
					jsonParser,
					urlencParser,
					rawBodyParser,
					this.callback,
					this.errorHandler
				);
			} else if (this.method == 'patch') {
				RED.httpNode.patch(
					this.url,
					cookieParser(),
					httpMiddleware,
					corsHandler,
					metricsHandler,
					jsonParser,
					urlencParser,
					rawBodyParser,
					this.callback,
					this.errorHandler
				);
			} else if (this.method == 'delete') {
				RED.httpNode.delete(
					this.url,
					cookieParser(),
					httpMiddleware,
					corsHandler,
					metricsHandler,
					jsonParser,
					urlencParser,
					rawBodyParser,
					this.callback,
					this.errorHandler
				);
			}

			this.on('close', function() {
				var node = this;
				RED.httpNode._router.stack.forEach(function(route, i, routes) {
					if (route.route && route.route.path === node.url && route.route.methods[node.method]) {
						routes.splice(i, 1);
					}
				});
			});
		} else {
			this.warn(RED._('httpin.errors.not-created'));
		}
	}
	RED.nodes.registerType('contract in', HTTPIn);

	/**
   *
   * @param {*} n n
   */
	function HTTPOut(n) {
		RED.nodes.createNode(this, n);
		var node = this;
		this.on('input', function(msg) {
			if (msg.res) {
				if (msg.headers) {
					msg.res._res.set(msg.headers);
				}
				if (msg.cookies) {
					for (var name in msg.cookies) {
						if (msg.cookies.hasOwnProperty(name)) {
							if (msg.cookies[name] === null || msg.cookies[name].value === null) {
								// eslint-disable-next-line no-negated-condition
								if (msg.cookies[name] !== null) {
									msg.res._res.clearCookie(name, msg.cookies[name]);
								} else {
									msg.res._res.clearCookie(name);
								}
							} else if (typeof msg.cookies[name] === 'object') {
								msg.res._res.cookie(name, msg.cookies[name].value, msg.cookies[name]);
							} else {
								msg.res._res.cookie(name, msg.cookies[name]);
							}
						}
					}
				}
				var statusCode = msg.statusCode || 200;

				logger.debug('END call msg.payload:');
				logger.debug(msg.payload);

				logger.debug('new memory:');
				logger.info(msg.memory);

				if (typeof msg.payload != 'object') {
					msg.payload = {
						result: msg.payload
					};
				}

				if (typeof msg.payload == 'object' && !Buffer.isBuffer(msg.payload)) {
					/*
                     *
                     *     TODO: ?????????????????????? !!!!!!!!!!!!!!!!!!!
                     * */

					logger.debug('msg.allowTransfer:', msg.allowTransfer);

					if (msg.memoryChanged == true && !msg.allowTransfer) {
						msg.payload = {
							result: msg.payload,
							memory: msg.memory,
							allowTransfer: msg.allowTransfer ? msg.allowTransfer : null,
							changeAsset: msg.changeAsset ? msg.changeAsset : null
						};
					}

					if (msg.memoryChanged == true && msg.allowTransfer) {
						msg.payload = {
							result: msg.payload,
							memory: msg.memory,
							allowTransfer: true,
							changeAsset: msg.changeAsset ? msg.changeAsset : null
						};
					}

					msg.res._res.status(statusCode).jsonp(msg.payload);
				} else {
					if (typeof msg.payload === 'number') {
						msg.payload = String(msg.payload);
					}

					if (msg.memoryChanged == true) {
						msg.payload = {
							result: msg.payload,
							memory: msg.memory,
							allowTransfer: msg.allowTransfer ? msg.allowTransfer : null,
							changeAsset: msg.changeAsset ? msg.changeAsset : null
						};
					}

					if (msg.allowTransfer) {
						msg.payload = {
							result: msg.payload,
							allowTransfer: true,
							changeAsset: msg.changeAsset ? msg.changeAsset : null
						};
					}

					msg.res._res.status(statusCode).send(msg.payload);
				}
			} else {
				node.warn(RED._('httpin.errors.no-response'));
			}
		});
	}
	RED.nodes.registerType('done', HTTPOut);

	/*
     *   Finish contract execution without saving a memory
     * */

	/**
      *
      * @param {*} n n
      */
	function falseFinish(n) {
		RED.nodes.createNode(this, n);
		var node = this;
		this.on('input', function(msg) {
			if (msg.res) {
				if (msg.headers) {
					msg.res._res.set(msg.headers);
				}
				if (msg.cookies) {
					for (var name in msg.cookies) {
						if (msg.cookies.hasOwnProperty(name)) {
							if (msg.cookies[name] === null || msg.cookies[name].value === null) {
								// eslint-disable-next-line no-negated-condition
								if (msg.cookies[name] !== null) {
									msg.res._res.clearCookie(name, msg.cookies[name]);
								} else {
									msg.res._res.clearCookie(name);
								}
							} else if (typeof msg.cookies[name] === 'object') {
								msg.res._res.cookie(name, msg.cookies[name].value, msg.cookies[name]);
							} else {
								msg.res._res.cookie(name, msg.cookies[name]);
							}
						}
					}
				}
				var statusCode = msg.statusCode || 403;

				logger.debug('ROLLBACK CONTRACT END');

				if (typeof msg.payload !== 'object') {
					msg.payload = {};
				}

				msg.payload.rejected = 'true';

				msg.res._res.status(statusCode).send(msg.payload);
			} else {
				node.warn(RED._('httpin.errors.no-response'));
			}
		});
	}

	RED.nodes.registerType('rollback', falseFinish);
};
