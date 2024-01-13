'use strict';

const createDatasourceMongoDB = require('./dsMongoDB');
const createDatasourcePostgreSQL = require('./dsPostgreSQL');
const createDatasourceHana = require('./dsHana');

module.exports = {
  mongoDB: {
    create: createDatasourceMongoDB
  },
  postgreSQL: {
    create: createDatasourcePostgreSQL
  },
  hana: {
    create: createDatasourceHana
  }
};
