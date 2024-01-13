'use strict';

const prompt = require('prompt');
const logger = require('log4js').getLogger('commands.services.prompt');
const constants = require('../../../configConstants').defaultConstants;

module.exports = (argv, configService, i18n) => {
  logger.debug('executing commands.services.prompt ');

  // Set when user prompt and used for generate default value of publicDNSName
  var usehttps = false;
  // Set when user prompt and used for generate default value of publicDNSName
  var ngrtPort;
  // Set when user prompt and used for generate default value of all IPAdresses being prompted
  var ngrtIPAddress;
  // Set when user prompt and used for generate default value
  var tenantID;
  // Set when user prompt and used for generate default value
  var instanceID;
  // Set when user prompt and used for generate default value
  var clusterID;
  // Set when user prompt and used for generate default value
  // var blockchainClusterID;

  var properties = [{
    name: 'primaryBlockchainProvider',
    description: i18n.__('Primary Blockchain Provider - ((B)igchainDB, (I)oTA or (T)ymlez '),
    type: 'string',
    pattern: /^(B|I|T)/,
    default: {
      toString: () => constants.primaryBlockchainProvider
    },
    required: true
  },
  {
    name: 'bigchaindbVersion',
    description: i18n.__('BigchainDB Version - (1.4 or 2.0)'),
    type: 'string',
    pattern: /^(1.4|2.0)/,
    required: true,
    default: {
      toString: () => constants.bigchaindbVersion
    },
    ask: function() {
      if (prompt.history('primaryBlockchainProvider').value == 'B') {
        return true;
      }
      return false;
    }
  },
  {
    name: 'iotaVersion',
    description: i18n.__('IoTA Version - (0.8 or 1.0)'),
    type: 'string',
    pattern: /^(0.8|1.0)/,
    required: true,
    default: {
      toString: () => constants.iotaVersion
    },
    ask: function() {
      if (prompt.history('primaryBlockchainProvider').value == 'I') {
        return true;
      }
      return false;
    }
  },
  {
    name: 'projectVersion',
    description: i18n.__('PROJECT Blockchain Version - (0.1 or 1.0)'),
    type: 'string',
    pattern: /^(0.1|1.0)/,
    required: true,
    default: {
      toString: () => constants.projectVersion
    },
    ask: function() {
      if (prompt.history('primaryBlockchainProvider').value == 'T') {
        return true;
      }
      return false;
    }
  },
  {
    name: 'serverEnvironment',
    description: i18n.__(
      'Server Environment - ((D)evelopment, (Q)uality, (P)roduction, (T)rial, (E)ducation) or (L)ocal)'),
    type: 'string',
    pattern: /^(D|Q|P|T|E|L)/,
    default: {
      toString: () => constants.serverEnvironment
    },
    required: true
  }, {
    name: 'blockchainClusterId',
    description: i18n.__('Blockchain Cluster ID'),
    type: 'string',
    default: {
      toString: () => constants.blockchainClusterId
    },
    before: value => {
      // blockchainClusterID = value;
      return value;
    },
    required: true
  }, {
    name: 'clusterId',
    description: i18n.__('Cluster ID'),
    type: 'string',
    default: {
      toString: () => constants.clusterId
    },
    before: value => {
      clusterID = value;
      return value;
    },
    required: true
  }, {
    name: 'envId',
    description: i18n.__('Environment ID'),
    type: 'string',
    default: {
      toString: () => constants.envId
    },
    required: true
  }, {
    name: 'instanceId',
    description: i18n.__('Instance ID'),
    type: 'string',
    default: {
      toString: () => constants.instanceId
    },
    before: value => {
      instanceID = value;
      return value;
    },
    required: true
  }, {
    name: 'tenantId',
    description: i18n.__('Tenant ID'),
    type: 'string',
    default: {
      toString: () => constants.tenantId
    },
    before: value => {
      tenantID = value;
      return value;
    },
    required: true
  }, {
    name: 'defaultDomainId',
    description: i18n.__('Default Domain ID'),
    type: 'string',
    default: {
      toString: () => constants.defaultDomainId
    },
    required: true
  }, {
    name: 'https',
    description: i18n.__('Use https protocol (true/false)'),
    type: 'boolean',
    required: true,
    default: {
      toString: () => constants.https
    }
  }, {
    name: 'autoUpdate',
    description: i18n.__('Auto update (true/false)'),
    type: 'boolean',
    default: {
      toString: () => constants.autoUpdate
    },
    required: true
  }, {
    name: 'createDefaultUsers',
    description: i18n.__('Create default Roles and Users (true/false)'),
    type: 'boolean',
    default: {
      toString: () => constants.createDefaultUsers
    },
    required: true
  }, {
    name: 'serverDeployment',
    description: i18n.__('Server Deployment - Single or Distributed'),
    type: 'string',
    pattern: /^(Single|Distributed)/,
    required: true,
    default: {
      toString: () => constants.serverDeployment
    }
  }, {
    name: 'serverType',
    description: i18n.__('Server Type - (Login) Server, (App)lication Server, (Full), (B)lock(c)hain Server or SmartContract Server (SC)'),
    type: 'string',
    pattern: /^(Login|App|Full|SC|Bc)/,
    required: true,
    default: {
      toString: () => constants.serverType
    },
    ask: function() {
      if (prompt.history('serverDeployment').value == 'Single') {
        return false;
      }
      return true;
    }
  }, {
    name: 'serverTypeSingleConfig',
    description: i18n.__('Server Type - (D)emo Apps, (F)ull Apps, (M)inimal Apps, (B)ootable Plugins'),
    type: 'string',
    pattern: /^(D|F|M|B)/,
    required: true,
    default: {
      toString: () => constants.serverTypeSingle
    },
    ask: function() {
      if (prompt.history('serverDeployment').value == 'Single') {
        return true;
      }
      return false;
    }
  },
  {
    name: 'NGRT_Port',
    description: i18n.__('Port of the NGRT server'),
    type: 'number',
    required: true,
    default: {
      toString: () => constants.NGRT_Port
    },
    before: value => {
      ngrtPort = value;
      return value;
    }
  }, {
    name: 'ng_rt_jwt_auth',
    description: i18n.__('IP Adress of the Authorization Server'),
    type: 'string',
    required: true,
    default: {
      toString: () => (usehttps ? 'https' : 'http') + '://127.0.0.1:' + ngrtPort
    },
    ask: function() {
      if (prompt.history('serverDeployment').value == 'Distributed') {
        return true;
      }
      return false;
    }
  }, {
    name: 'jwtAuthClusterId',
    description: i18n.__('JWT auth Cluster ID'),
    type: 'string',
    required: true,
    default: {
      toString: () => clusterID
    }
  }, {
    name: 'jwtAuthInstanceId',
    description: i18n.__('JWT auth Instance ID'),
    type: 'string',
    required: true,
    default: {
      toString: () => instanceID
    }
  },

  {
    name: 'jwtAuthTenantId',
    description: i18n.__('JWT auth Tenant ID'),
    type: 'string',
    required: true,
    default: {
      toString: () => tenantID
    }
  }, {
    name: 'ng_rt_admin',
    description: i18n.__('IP adress of the Application Server'),
    type: 'string',
    required: true,
    default: {
      toString: () => (usehttps ? 'https' : 'http') + '://127.0.0.1:' + ngrtPort
    },
    ask: function() {
      if (prompt.history('serverDeployment').value == 'Distributed' && prompt.history('serverType').value == 'Login') {
        return true;
      }
      return false;
    }
  }, {
    name: 'NODE_RED_Port',
    description: i18n.__('Port of Node-Red'),
    type: 'number',
    required: true,
    default: {
      toString: () => constants.NODE_RED_Port
    }
  }, {
    name: 'databaseType',
    description: i18n.__('PROJECT default Database (mongodb, postgresql or hana)'),
    type: 'string',
    pattern: /^(mongodb|postgresql|hana)/,
    default: {
      toString: () => constants.databaseType
    },
    required: true
  }, {
    name: 'defaultDS_IP_Address',
    description: i18n.__('IP Address of the default Database'),
    type: 'string',
    pattern: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
    required: true,
    default: {
      toString: () => constants.defaultDS_IP_Address
    },
    before: value => {
      ngrtIPAddress = value;
      return value;
    }
  }, {
    name: 'defaultDS_Port',
    description: i18n.__('Port of the default Database'),
    type: 'number',
    required: true,
    default: {
      toString: () => constants.defaultDS_MongoDBPort
    }
  },
  {
    name: 'defaultDS_User',
    description: i18n.__('User of the default Database'),
    type: 'string',
    required: true,
    default: {
      toString: () => constants.defaultDS_User
    },
    ask: function() {
      if (prompt.history('databaseType').value == 'postgresql' || prompt.history('databaseType').value == 'hana') {
        return true;
      }
      return false;
    }
  },
  {
    name: 'defaultDS_Password',
    description: i18n.__('Password of the default Database'),
    type: 'string',
    required: true,
    default: {
      toString: () => constants.defaultDS_Password
    },
    ask: function() {
      if (prompt.history('databaseType').value == 'postgresql' || prompt.history('databaseType').value == 'hana') {
        return true;
      }
      return false;
    }
  },
  {
    name: 'defaultDS_Database',
    description: i18n.__('Database of the default Database'),
    type: 'string',
    required: true,
    default: {
      toString: () => constants.serverEnvironment +
        '_' + constants.blockchainClusterId +
        '_' + constants.clusterId +
        '_' + constants.instanceId +
        '_' + constants.tenantId +
        '_ng_rt'
    }
  },
  {
    name: 'defaultDS_Schema',
    description: i18n.__('Schema of the default Database'),
    type: 'string',
    required: true,
    default: {
      toString: () => constants.defaultDS_Schema
    },
    ask: function() {
      if (prompt.history('databaseType').value == 'postgresql' || prompt.history('databaseType').value == 'hana') {
        return true;
      }
      return false;
    }
  },
  {
    name: 'defaultDS_hanaEndpoint',
    description: i18n.__('Endpoint of the default Database'),
    type: 'string',
    required: true,
    default: {
      toString: () => constants.defaultDS_hanaEndpoint
    },
    ask: function() {
      if (prompt.history('databaseType').value == 'hana') {
        return true;
      }
      return false;
    }
  },
  {
    name: 'defaultDS_ConnectionTimeout',
    description: i18n.__('Connection Timeout of the default Database'),
    type: 'number',
    required: true,
    default: {
      toString: () => constants.defaultDS_ConnectionTimeout
    },
    ask: function() {
      if (prompt.history('databaseType').value == 'postgresql') {
        return true;
      }
      return false;
    }
  },
  {
    name: 'defaultDS_ReadTimeout',
    description: i18n.__('Read Timeout of the default Database'),
    type: 'number',
    required: true,
    default: {
      toString: () => constants.defaultDS_ReadTimeout
    },
    ask: function() {
      if (prompt.history('databaseType').value == 'postgresql') {
        return true;
      }
      return false;
    }
  },
  {
    name: 'defaultDS_OperationTimeout',
    description: i18n.__('Operation Timeout of the default Database'),
    type: 'number',
    required: true,
    default: {
      toString: () => constants.defaultDS_OperationTimeout
    },
    ask: function() {
      if (prompt.history('databaseType').value == 'postgresql') {
        return true;
      }
      return false;
    }
  }, {
    name: 'Tendermint_IP_Address',
    description: i18n.__('IP Address of the Blockchain environment'),
    type: 'string',
    pattern: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
    required: true,
    default: {
      toString: () => ngrtIPAddress
    }
  }, {
    name: 'Tendermint_Port',
    description: i18n.__('Port of the Blockchain environment'),
    type: 'number',
    required: true,
    default: {
      toString: () => constants.Tendermint_Port
    }
  }, {
    name: 'Messaging_IP_Address',
    description: i18n.__('IP Address of the Messaging environment'),
    type: 'string',
    pattern: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
    required: true,
    default: {
      toString: () => ngrtIPAddress
    }
  }, {
    name: 'Messaging_Port',
    description: i18n.__('Port of the Messaging environment'),
    type: 'number',
    required: true,
    default: {
      toString: () => constants.Messaging_Port
    }
  }, {
    name: 'Messaging_Admin',
    description: i18n.__('Admin Port of the Messaging environment'),
    type: 'number',
    required: true,
    default: {
      toString: () => constants.Messaging_Admin
    }
  }, {
    name: 'StatsD_IP_Address',
    description: i18n.__('IP Address of the Monitoring environment'),
    type: 'string',
    pattern: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
    required: true,
    default: {
      toString: () => ngrtIPAddress
    }
  }, {
    name: 'StatsD_Port',
    description: i18n.__('Port of the Monitoring environment'),
    type: 'number',
    required: true,
    default: {
      toString: () => constants.StatsD_Port
    }
  }, {
    name: 'StatsD_Admin_Port',
    description: i18n.__('Port of the Monitoring Admin Dashboard'),
    type: 'number',
    required: true,
    default: {
      toString: () => constants.StatsD_Admin_Port
    }
  }, {
    name: 'dockerAdminPort',
    description: i18n.__('Port of the Docker Admin server'),
    type: 'number',
    required: true,
    default: {
      toString: () => constants.dockerAdminPort
    }
  }, {
    name: 'SC_IP_Address',
    description: i18n.__('IP Address for the Smart Contracts environment'),
    type: 'string',
    pattern: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
    required: true,
    default: {
      toString: () => ngrtIPAddress
    }
  }, {
    name: 'SC_Port',
    description: i18n.__('Port for the Smart Contracts environment'),
    type: 'number',
    required: true,
    default: {
      toString: () => constants.SC_Port
    }
  }, {
    name: 'log4jsDB_IP_Address',
    description: i18n.__('IP Address of the Logging environment'),
    type: 'string',
    pattern: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
    required: true,
    default: {
      toString: () => ngrtIPAddress
    }
  }, {
    name: 'log4jsDB_Port',
    description: i18n.__('Port of the Logging environment'),
    type: 'number',
    required: true,
    default: {
      toString: () => constants.log4jsDB_Port
    }
  }, {
    name: 'BigchainDB_defaultDS_IP_Address',
    description: i18n.__('BigchainDB_defaultDS_IP_Address'),
    type: 'string',
    pattern: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
    required: true,
    default: {
      toString: () => constants.BigchainDB_defaultDS_IP_Address
    }
  }, {
    name: 'BigchainDB_defaultDS_Port',
    description: i18n.__('BigchainDB_defaultDS_Port'),
    type: 'number',
    required: true,
    default: {
      toString: () => constants.BigchainDB_defaultDS_Port
    }
  }, {
    name: 'Public_Host',
    description: i18n.__('Public URL:Port of ng-rt service'),
    type: 'string',
    required: true,
    default: {
      toString: () => (usehttps ? 'https' : 'http') + '://localhost:' + ngrtPort
    }
  }, {
    name: 'internalDNSName',
    description: i18n.__('Internal URL of ng-rt service'),
    type: 'string',
    required: true,
    default: {
      toString: () => (usehttps ? 'https' : 'http') + '://localhost'
    }
  }, {
    name: 'JWT_PROJECT_SECRET',
    description: 'JWT Secret',
    type: 'string',
    required: true,
    default: {
      toString: () => constants.JWT_PROJECT_SECRET
    }
  }, {
    name: 'namespace',
    description: i18n.__('namespace for Root URL'),
    type: 'string',
    default: {
      toString: () => constants.namespace
    },
    required: true
  }
  ];

  return new Promise((resolve, reject) => {
    if (argv.silent) {
      // convert as prompt doesn't accepts boolean at all
      constants.https = (constants.https == "true");
      constants.autoUpdate = (constants.autoUpdate == "true");
      constants.createDefaultUsers = (constants.createDefaultUsers == "true");

      return resolve(constants);
    }

    prompt.start();
    prompt.get(properties, function(err, result) {
      if (err) return reject(null);
      // console.log('Result : ', result);
      return resolve(result);
    });
  });
};
