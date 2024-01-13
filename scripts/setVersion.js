/* eslint-disable no-console */
'use strict';
var argv = require('minimist')(process.argv.slice(2));

var fs = require('fs');

if (!argv.file || !argv.number) {
  console.log("No arguments");
} else {
  getFile(argv.file).then(text => {
    modifyFile(argv.file, text).then(() => {
      console.log("set version completed");
    }).catch(err => {
      console.error(err);
    });
  });
}

/**
 * creates all required files for starting the server
 * @param {string}  filePath - the name of the path
 * @return {Promise} - get file promise
 */
function getFile(filePath) {
  return new Promise((resolve, reject) => {
    console.log(filePath);
    fs.readFile(filePath, 'utf-8', (err, text) => {
            // console.log('file readed', err, text);
      if (err) {
        console.error(err);
        return reject(err);
      }
            // console.log('text',text);
      return resolve(text);
    });
  });
}

/**
* creates all required files for starting the server
* @param {string}  filePath - the name of the path
* @param {string}  text - the name of the text
* @return {Promise} - promise
*/
function modifyFile(filePath, text) {
  return new Promise((resolve, reject) => {
    var content = text.replace(/{build_number}/gi, argv.number);
    fs.writeFile(filePath, content, err => {
      if (err) return reject("Error on save file", err);
      return resolve();
    });
  });
}
