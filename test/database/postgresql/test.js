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
var Model;

console.log('Create new Model')
Model = db.define('Test', {
  name: {type: String},
});

console.log('Auto-update')
db.autoupdate('Test', function(err) {
  if (err) throw err;
  console.log('Model Test updated in ', db.adapter.name);
});

console.log('Test.create')
Model.create({
  name: 'Tony',
}).then(function(test) {
  console.log('create instance ' + util.inspect(test, 4));
  return Model.find({where: {name: 'Tony'}});
}).catch(function (err) {
  console.log('Err');
});

console.log('DONE !!!')
