'use strict';
const path = require('path');

describe('/utils/bs58.js', function() {
  global.appBase = global.appBase || path.resolve(__dirname, '../../../..');
  var bs58 = require(path.join(global.appBase, 'utils/bs58'));

  it('should encode and decode', done => {
    var src = "003c176e659bea0f29a3e9bf7880c112b1b31b4dc826268187";
    var encoded = bs58.encode(new Buffer(src, 'hex'));
    (new Buffer(bs58.decode(encoded))).toString('hex').should.be.equal(src);
    done();
  });
});
