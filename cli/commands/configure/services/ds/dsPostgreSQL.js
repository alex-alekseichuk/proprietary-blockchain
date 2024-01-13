
'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('log4js').getLogger('commands.services.dsPostgreSQL');
const server = "../../../../../server";

module.exports = configService => {
  logger.debug('executing configService');

  const createDatabaseConnector = (name, databaseName) => {
    let ds = {
      name: name,
      connector: configService.get('datasources:default:connector'),
      database: databaseName,
      host: configService.get('datasources:default:host'),
      port: configService.get('datasources:default:port'),
      user: configService.get('datasources:default:user'),
      password: configService.get('datasources:default:password')
    };
    let maxOfflineRequests = configService.get('datasources:default:maxOfflineRequests');
    if (maxOfflineRequests !== undefined && maxOfflineRequests !== null)
      ds.maxOfflineRequests = maxOfflineRequests;
    return ds;
  };

  const createDSNgApp = () => {
    return createDatabaseConnector('ng_app', 'ng_rt_app');
  };

  const createDSNgRt = () => {
    return createDatabaseConnector('ng_rt', 'ng_rt_core');
  };

  const createDSNgRtNodeRed = () => {
    return createDatabaseConnector('ng_rt_node_red', 'ng_rt_node_red');
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
    return createDatabaseConnector('ng_rt_jwt_auth', 'ng_rt_jwt_auth');
  };

  return new Promise((resolve, reject) => {
    var datasources = {
      db: createDSDb(),
      Email: createDSMail(),
      ng_app: createDSNgApp(),
      ng_rt: createDSNgRt(),
      ng_rt_node_red: createDSNgRtNodeRed()
    };

    datasources.ng_rt_jwt_auth = createDSNgRtJwtAuth();

    fs.writeFileSync(path.join(__dirname, server, "datasources.json"), JSON.stringify(datasources, null, 2));
    return resolve(true);
  });
};
