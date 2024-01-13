'use strict';

var util = require('util');

// Here we create datasource dynamically.
var DataSource = require('loopback-datasource-juggler').DataSource;
var postgresql = require('loopback-connector-postgresql');

var config = {
  host: '127.0.0.1',
  port: '5432',
  database: 'core',
  password: 'admin',
  user: 'admin'
};

console.log('Create new Datasource')
var db = new DataSource(postgresql, config);
var Test;
let record;

async function createModel(db) {
  console.log('Start : Create new Model')
  Test = await db.define('Test', {
    name: { type: String },
  });
  console.log('Done : Create new model')
  return Test
}

async function autoUpdate(db) {
  console.log('Auto-update')
  await db.autoupdate('Test', function (err) {
    if (err) throw err;
    console.log('Model Test updated in ', db.adapter.name);
  });
  return db
}

async function createRecord(Test) {
  console.log('Test.create')
  await Test.create({
    name: 'Tony',
  }).then(function (test) {
    console.log('create instance ' + util.inspect(test, 4));
    return Test.find({ where: { name: 'Tony' } });
  }).catch(function (err) {
    console.log('Err');
  });
  console.log('DONE !!!')

}

console.log('Start createModel')
Test = createModel(db);
console.log('Start autoUpdate')
db = autoUpdate(db)
console.log('Start createRecord')
record = createRecord(Test);
console.log('Record :', record)




