'use strict';

var path = require('path');
var fs = require('fs');

exports.privateKey = fs.readFileSync(path.join(__dirname, './private/ng-rt.key')).toString();
exports.certificate = fs.readFileSync(path.join(__dirname, './private/ng-rt.crt')).toString();
