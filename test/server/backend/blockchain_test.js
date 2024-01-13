'use strict';
var chai = require('chai');
chai.should();
var path = require('path');
var fs = require('fs');

describe.skip('ng-rt-blockchain', function() {
  global.appBase = global.appBase || path.resolve(__dirname, '../../..');
  const config = require('ng-configservice');
  config.read('config/server/config.json');
  var rethinkdb = require(path.join(global.appBase, 'server/backend/rethinkdb'));

  before(() => {
    return rethinkdb.connect(config)
      .then(() => {
        process.env.bigchainDbHost = config.get('bigchainDbHost');
        process.env.bigchainDbPort = config.get('bigchainDbPort');
      });
  });

  var listenForTx = () => {
    // start listening for new tx
    return rethinkdb.findCursor({
      filter: (r, query) => {
        return query.changes();
      }
    })
      .then(cursor => {
        return new Promise((resolve, reject) => {
          cursor.each(function(err, item) {
            if (err || !item.new_val || item.old_val)
              return;
            var payload = item.new_val.block.transactions[0].transaction.data.payload;
            cursor.close().then(() => {
              resolve(payload);
            });
          });
        });
      });
  };

  it('can post tx with large (200K) payload', function(done) {
    // open large file
    var contentPath = path.resolve(__dirname, './poster.jpg');
    fs.open(contentPath, 'r', function(status, fd) {
      if (status) {
        return;
      }

      // read content into the buffer
      var buffer = new Buffer(1024 * 10000); // ~10M max size of content
      fs.read(fd, buffer, 0, buffer.length, 0, function(err, bytes) {
        if (bytes > 0) {
          var file = buffer.slice(0, bytes);

          listenForTx()
            .then(payload => {
              var content = new Buffer(payload.file, 'base64');
              content.should.be.deep.equal(file);
              done();
            });
        }
      });
    });
  });

  it('can post via postCreateTx method', () => {
    var listenPromise = listenForTx().then(payload => payload.test.should.be.equal('done'));
    return listenPromise;
  });
});
