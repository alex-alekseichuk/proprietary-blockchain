/* eslint-disable no-console */
"use strict";

try {
  let configService = require('ng-configservice');
  configService.read('config/server/config.json');

  let namespace = configService.get('namespace') ? configService.get('namespace') : "ng-rt-core";
  let port = configService.get("ngrtPort");
  let url = `http://localhost:${port}/${namespace}/healthcheck`;

  const request = require("request");
  request(url, (error, response, body) => {
    if (response && response.statusCode === 200) {
      console.log("Healthcheker success!");

      // statsd-event
      return process.exit(0);
    }
    if (error) console.log('error:', error); // Print the error if one occurred
    process.exit(1);
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}
