'use strict';
const logger = require('log4js').getLogger('ng-rt-node-red.authenticate.remote');
const request = require('request');

module.exports = (url, roles) => {
  return {
    authenticate: (username, password) => {
      return new Promise((resolve, reject) => {
        request({
          method: 'POST',
          uri: `${url}/auth/login`,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            isLdap: false,
            password: password,
            username: username,
            remember_me: false
          })
        }, (err, resp, respBody) => {
          if (err || resp.statusCode !== 200) {
            if (err) logger.error(err);
            return resolve(null);
          }
          if (!roles)
            return resolve({username: username, permissions: "*"});
          if (respBody && typeof respBody === 'string')
            respBody = JSON.parse(respBody);
          request({
            method: 'GET',
            uri: `${url}/ng-rt-admin/roles`,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': "JWT " + respBody.token
            }
          }, (err, resp2, respBody2) => {
            if (err || resp2.statusCode !== 200) {
              if (err) logger.error(err);
              return resolve(null);
            }
            if (typeof respBody2 === 'string')
              respBody2 = JSON.parse(respBody2);
            let userRoles = respBody2.roles;
            if (roles.some(r => userRoles.indexOf(r) > -1))
              return resolve({username: username, permissions: "*"});
            resolve(null);
          });
        });
      });
    },
    users: username => {
      return new Promise((resolve, reject) => {
        resolve({username: username, permissions: "*"});
      });
    }
  };
};
