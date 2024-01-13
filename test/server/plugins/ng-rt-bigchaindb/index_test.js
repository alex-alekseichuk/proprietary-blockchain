'use strict';
const chai = require('chai');
const {common} = require('ng-common');
const util = common.util;
require('chai').should();
const engineHelper = require('../../engine/helper');

let txFactory = require('./factory/txFactory');

describe('ng-rt-bigchaindb', function() {
  let scope = {};
  before(() =>
    engineHelper.init()
      .then(() => {
        scope.blockchain = engineHelper.services.get('blockchain');
      })
  );

  it('should create keys', function(done) {
    txFactory.set({
      keys: {
        alice: scope.blockchain.driver.keys.generate(),
        bob: scope.blockchain.driver.keys.generate()
      }
    });

    chai.expect(txFactory.get().keys.alice).to.not.equal(null);
    chai.expect(txFactory.get().keys.bob).to.not.equal(null);
    done();
  });

  it('should create tx', function(done) {
    let asset = {
      data: 'test'
    };

    let tx = scope.blockchain.createTx(asset, txFactory.get().keys.alice.public_key,
      txFactory.get().keys.alice.private_key);
    txFactory.set({
      createTx: tx
    });
    chai.expect(txFactory.get().createTx.id).to.not.equal(null);
    done();
  });

  it.skip('should push tx', function(done) {
    new Promise(res =>
      scope.blockchain.postTxRecord(txFactory.get().createTx, res)
    )
      .then(data => {
        chai.expect(data).to.exist;
        chai.expect(JSON.parse(data).id).to.exist;
        return util.delay(3000);
      })
      .then(done)
      .catch(err => {
        chai.expect(err).to.equal(null);
        done();
      });
  });
});
