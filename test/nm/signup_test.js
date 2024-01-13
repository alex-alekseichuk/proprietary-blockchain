'use strict';
// const argv = require('minimist')(process.argv.slice(2));
// const targets = {
//   local: 'http://localhost:8443',
//   dev: 'https://dev.project.com',
//   devIp: 'http://10.0.50.39:8143',
//   24: 'http://10.0.50.24:8443'
// };
// const URI = argv.uri || targets[argv.t] || targets[argv.target] || targets.devIp;
describe('Simple signup test with random generated user', function() {
  const PERTEST_TIMEOUT = 20 * 120000;

  it('should signup', function(done) {
    this.timeout(PERTEST_TIMEOUT);
    return done();
  });
});
