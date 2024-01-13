
'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('log4js').getLogger('commands.services.dsPostgreSQL');
const server = "../../../../../server";

module.exports = configService => {
  logger.debug('executing configService');

  const createDSNgApp = () => {
    var ds = {
      name: 'ng_app',
      connector: configService.get('datasources:default:connector'),
      endpoint: configService.get('datasources:default:endpoint'),
      username: configService.get('datasources:default:user'),
      password: configService.get('datasources:default:password'),
      schema: configService.get('datasources:default:schema'),
      database: configService.get('datasources:default:database'),
      convertTableNameToUpperCase: configService.get('datasources:default:convertTableNameToUpperCase') ? configService.get('datasources:default:convertTableNameToUpperCase') : false,
      debug: configService.get('datasources:default:debug') ? configService.get('datasources:default:debug') : false

    };
    return ds;
  };

  const createDSNgRt = () => {
    var ds = {
      name: 'ng_rt',
      connector: configService.get('datasources:default:connector'),
      endpoint: configService.get('datasources:default:endpoint'),
      username: configService.get('datasources:default:user'),
      password: configService.get('datasources:default:password'),
      schema: configService.get('datasources:default:schema'),
      database: configService.get('datasources:default:database'),
      convertTableNameToUpperCase: configService.get('datasources:default:convertTableNameToUpperCase') ? configService.get('datasources:default:convertTableNameToUpperCase') : false,
      debug: configService.get('datasources:default:debug') ? configService.get('datasources:default:debug') : false

    };
    return ds;
  };

  const createDSNgRtNodeRed = () => {
    var ds = {
      name: 'ng_rt_node_red',
      connector: configService.get('datasources:default:connector'),
      endpoint: configService.get('datasources:default:endpoint'),
      username: configService.get('datasources:default:user'),
      password: configService.get('datasources:default:password'),
      schema: configService.get('datasources:default:schema'),
      database: configService.get('datasources:default:database'),
      convertTableNameToUpperCase: configService.get('datasources:default:convertTableNameToUpperCase') ? configService.get('datasources:default:convertTableNameToUpperCase') : false,
      debug: configService.get('datasources:default:debug') ? configService.get('datasources:default:debug') : false

    };
    return ds;
  };

  const createDSDb = () => {
    var ds = {
      name: "db",
      connector: "memory"
    };
    return ds;
  };

  const createDSMail = () => {
    var ds = {
      name: "Email",
      connector: "mail",
      transports: [{
        type: "SMTP",
        host: configService.get('datasources:email:SMTP:host'),
        secure: false,
        port: configService.get('datasources:email:SMTP:port'),
        auth: {
          user: configService.get('datasources:email:SMTP:user'),
          pass: configService.get('datasources:email:SMTP:pass')
        },
        tls: {
          ciphers: "SSLv3"
        }
      }]
    };
    return ds;
  };
  const createDSNgRtJwtAuth = () => {
    var ds = {
      name: 'ng_rt_jwt_auth',
      connector: configService.get('datasources:default:connector'),
      endpoint: configService.get('datasources:default:endpoint'),
      username: configService.get('datasources:default:user'),
      password: configService.get('datasources:default:password'),
      schema: configService.get('datasources:default:schema'),
      database: configService.get('datasources:default:database'),
      convertTableNameToUpperCase: configService.get('datasources:default:convertTableNameToUpperCase') ? configService.get('datasources:default:convertTableNameToUpperCase') : false,
      debug: configService.get('datasources:default:debug') ? configService.get('datasources:default:debug') : false

    };
    return ds;
  };

  const createDSNgRtJwtAuthJwt = () => {
    var ds = {
      name: 'ng_rt_jwt_auth',
      connector: configService.get('datasources:default:connector'),
      endpoint: configService.get('datasources:default:endpoint'),
      username: configService.get('datasources:default:user'),
      password: configService.get('datasources:default:password'),
      schema: configService.get('datasources:default:schema'),
      database: configService.get('datasources:default:database'),
      convertTableNameToUpperCase: configService.get('datasources:default:convertTableNameToUpperCase') ? configService.get('datasources:default:convertTableNameToUpperCase') : false,
      debug: configService.get('datasources:default:debug') ? configService.get('datasources:default:debug') : false

    };
    return ds;
  };

  return new Promise((resolve, reject) => {
    var datasources = {
      db: createDSDb(),
      Email: createDSMail(),
      ng_app: createDSNgApp(),
      ng_rt: createDSNgRt(),
      ng_rt_node_red: createDSNgRtNodeRed()
    };

    // configure special ng_rt_jwt_auth datasource to touch user from another db
    if (configService.get('serverDeployment') === 'Distributed' && configService.get('serverType') === 'App') {
      datasources.ng_rt_jwt_auth = createDSNgRtJwtAuth();
    } else {
      datasources.ng_rt_jwt_auth = createDSNgRtJwtAuthJwt();
    }

    fs.writeFileSync(path.join(__dirname, server, "datasources.json"), JSON.stringify(datasources, null, 2));
    return resolve(true);
  });
};
