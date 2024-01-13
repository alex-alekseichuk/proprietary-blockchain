'use strict';

const result = {
  primaryBlockchainProvider: {
    default: process.env.primaryBlockchainProvider || 'B',
    processEnv: process.env.primaryBlockchainProvider
  },
  bigchaindbVersion: {
    default: process.env.bigchaindbVersion || '2.0',
    processEnv: process.env.bigchaindbVersion
  },
  iotaVersion: {
    default: process.env.iotaVersion || '1.0',
    processEnv: process.env.iotaVersion
  },
  projectVersion: {
    default: process.env.projectVersion || '1.0',
    processEnv: process.env.projectVersion
  },
  databaseType: {
    default: process.env.databaseType || 'mongodb',
    processEnv: process.env.databaseType
  },
  namespace: {
    default: process.env.namespace || 'ng-rt-core',
    processEnv: process.env.namespace
  },
  serverEnvironment: {
    default: process.env.serverEnvironment || 'D',
    processEnv: process.env.serverEnvironment
  },
  clusterId: {
    default: process.env.clusterId || 'local',
    processEnv: process.env.clusterId
  },
  blockchainClusterId: {
    default: process.env.blockchainClusterId || 'bc1',
    processEnv: process.env.blockchainClusterId
  },
  envId: {
    default: process.env.envId || 'rt',
    processEnv: process.env.envId
  },
  NODE_RED_Port: {
    default: process.env.NODE_RED_Port || 8444,
    processEnv: process.env.NODE_RED_Port
  },
  defaultDomainId: {
    default: process.env.defaultDomainId || 'd01',
    processEnv: process.env.defaultDomainId
  },
  https: {
    default: process.env.https || "false",
    processEnv: process.env.https
  },
  instanceId: {
    default: process.env.instanceId || 'i01',
    processEnv: process.env.instanceId
  },
  tenantId: {
    default: process.env.tenantId || 't01',
    processEnv: process.env.tenantId
  },
  autoUpdate: {
    default: process.env.autoUpdate || "true",
    processEnv: process.env.autoUpdate
  },
  createDefaultUsers: {
    default: process.env.createDefaultUsers || "true",
    processEnv: process.env.createDefaultUsers
  },
  serverDeployment: {
    default: process.env.serverDeployment || 'Single',
    processEnv: process.env.serverDeployment
  },
  serverType: {
    default: process.env.serverType || 'Full',
    processEnv: process.env.serverType
  },
  serverTypeSingle: {
    default: process.env.serverTypeSingleConfig || 'F',
    processEnv: process.env.serverTypeSingleConfig
  },
  NGRT_Port: {
    default: process.env.NGRT_Port || 8443,
    processEnv: process.env.NGRT_Port
  },
  jwtAuthClusterId: {
    default: process.env.jwtAuthClusterId || 'LOCAL',
    processEnv: process.env.jwtAuthClusterId
  },
  jwtAuthInstanceId: {
    default: process.env.jwtAuthInstanceId || 'I01',
    processEnv: process.env.jwtAuthInstanceId
  },
  jwtAuthTenantId: {
    default: process.env.jwtAuthTenantId || 'T01',
    processEnv: process.env.jwtAuthTenantId
  },
  defaultDS_IP_Address: {
    default: process.env.defaultDS_IP_Address || '127.0.0.1',
    processEnv: process.env.defaultDS_IP_Address
  },
  defaultDS_Port: {
    default: process.env.defaultDS_Port,
    processEnv: process.env.defaultDS_Port
  },
  defaultDS_MongoDBPort: {
    default: process.env.defaultDS_MongoDBPort || 37017,
    processEnv: process.env.defaultDS_MongoDBPort
  },
  defaultDS_postgresqlPort: {
    default: process.env.defaultDS__PostgresqlPort || 5432,
    processEnv: process.env.defaultDS_PostgresqlPort
  },
  defaultDS_hanaEndpoint: {
    default: process.env.defaultDS_hanaEndpoint || '127.0.0.1:39015',
    processEnv: process.env.defaultDS_hanaEndpoint
  },
  defaultDS_User: {
    default: process.env.defaultDS_User,
    processEnv: process.env.defaultDS_User
  },
  defaultDS_Password: {
    default: process.env.defaultDS_Password,
    processEnv: process.env.defaultDS_Password
  },
  defaultDS_Database: {
    default: process.env.defaultDS_Database || "core",
    processEnv: process.env.defaultDS_Database
  },
  defaultDS_Schema: {
    default: process.env.defaultDS_Schema || "schema",
    processEnv: process.env.defaultDS_Schema
  },
  defaultDS_ConnectionTimeout: {
    default: process.env.defaultDS_ConnectionTimeout || "30000",
    processEnv: process.env.defaultDS_ConnectionTimeout
  },
  defaultDS_ReadTimeout: {
    default: process.env.defaultDS_ReadTimeout || "30000",
    processEnv: process.env.defaultDS_ReadTimeout
  },
  defaultDS_OperationTimeout: {
    default: process.env.defaultDS_OperationTimeout || "15000",
    processEnv: process.env.defaultDS_OperationTimeout
  },
  defaultDS_N1qlport: {
    default: process.env.defaultDS_N1qlport || "8093",
    processEnv: process.env.defaultDS_N1qlport
  },
  Tendermint_Port: {
    default: process.env.Tendermint_Port || 26657,
    processEnv: process.env.Tendermint_Port
  },
  Tendermint_IP_Address: {
    default: process.env.Tendermint_IP_Address || '127.0.0.1',
    processEnv: process.env.Tendermint_IP_Address
  },
  StatsD_IP_Address: {
    default: process.env.StatsD_IP_Address || '127.0.0.1',
    processEnv: process.env.StatsD_IP_Address
  },
  StatsD_Port: {
    default: process.env.StatsD_Port || 8125,
    processEnv: process.env.StatsD_Port
  },
  Messaging_IP_Address: {
    default: process.env.Messaging_IP_Address || '127.0.0.1',
    processEnv: process.env.Messaging_IP_Address
  },
  Messaging_Port: {
    default: process.env.Messaging_Port || 5172,
    processEnv: process.env.Messaging_Port
  },
  Messaging_Admin: {
    default: process.env.Messaging_Admin || 8188,
    processEnv: process.env.Messaging_Admin
  },
  JWT_PROJECT_SECRET: {
    default: process.env.JWT_PROJECT_SECRET || 'JWT_PROJECT_SECRET',
    processEnv: process.env.JWT_PROJECT_SECRET
  },
  StatsD_Admin_Port: {
    default: process.env.StatsD_Admin_Port || 3000,
    processEnv: process.env.StatsD_Admin_Port
  },
  dockerAdminPort: {
    default: process.env.dockerAdminPort || 9000,
    processEnv: process.env.dockerAdminPort
  },
  SC_IP_Address: {
    default: process.env.SC_IP_Address || '127.0.0.1',
    processEnv: process.env.SC_IP_Address
  },
  SC_Port: {
    default: process.env.SC_Port || 8443,
    processEnv: process.env.SC_Port
  },
  internalDNSName: {
    default: process.env.internalDNSName || 'http://localhost',
    processEnv: process.env.internalDNSName
  },
  log4jsDB_Port: {
    default: process.env.log4jsDB_Port || 37017,
    processEnv: process.env.log4jsDB_Port
  },
  log4jsDB_IP_Address: {
    default: process.env.log4jsDB_IP_Address || '127.0.0.1',
    processEnv: process.env.log4jsDB_IP_Address
  },
  BigchainDB_defaultDS_IP_Address: {
    default: process.env.BigchainDB_defaultDS_IP_Address || '127.0.0.1',
    processEnv: process.env.BigchainDB_defaultDS_IP_Address
  },
  BigchainDB_defaultDS_Port: {
    default: process.env.BigchainDB_defaultDS_Port || 27017,
    processEnv: process.env.BigchainDB_defaultDS_Port
  }
};

// variables depends from ngrtPort
result.ng_rt_admin = {
  default: 'http://localhost:' + result.NGRT_Port.default,
  processEnv: result.NGRT_Port.processEnv
};
result.Public_Host = {
  default: 'http://localhost:' + result.NGRT_Port.default,
  processEnv: result.NGRT_Port.processEnv
};

const defaultConstants = {};
Object.keys(result).forEach(field => {
  defaultConstants[field] = result[field].default;
});

module.exports.defaultConstants = defaultConstants;
module.exports.constants = result;
