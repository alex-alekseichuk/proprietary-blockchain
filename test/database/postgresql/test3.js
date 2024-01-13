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
var ds = new DataSource(postgresql, config);
var model;
let record;

async function autoUpdate(ds) {
  console.log('Start autoUpdate')
  // create a new promise inside of the async function
  let promise = new Promise((resolve, reject) => {
    ds.autoupdate('Test', function (err) {
      if (err) throw err;
      console.log('Model Test updated in ', ds.adapter.name);
    });
    console.log('Done autoUpdate')
    resolve();
  });

  // wait for the promise to resolve
  let result = await promise;
}

async function createRecord(model) {
  console.log('Start : createRecord')

  // create a new promise inside of the async function
  let promise = new Promise((resolve, reject) => {
    console.log('model.create')
    model.create({
      name: 'Tony',
    }).then(function (test) {
      console.log('create instance ' + util.inspect(test, 4));
      return model.find({ where: { name: 'Tony' } });
    }).catch(function (err) {
      console.log('Err');
    });
    console.log('Done : createRecord')
    resolve();
  });

  // wait for the promise to resolve
  let result = await promise;

}

async function createModel(ds) {

  // create a new promise inside of the async function
  let promise = new Promise((resolve, reject) => {
    console.log('Start : Create new Model')
    model = ds.define('Test', {
      name: { type: String },
    });
    console.log('Done : Create new model')
    resolve(model);
  });

  // wait for the promise to resolve
  var result = await promise;
  return result;
}

// call the function
console.log('1')
model = createModel(ds);
console.log('2')
autoUpdate(ds);
console.log('3')
createRecord(model);



