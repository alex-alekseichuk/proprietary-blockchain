'use strict';
/* eslint-disable no-unused-vars , no-console*/
var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = chai.expect;
chai.use(chaiHttp);
var request = require('request');
var Base64 = require('js-base64').Base64;
const logger = require('log4js').getLogger('test.plugins.ng-rt-abci_test');
const transaction = require('ng-rt-digitalAsset-sdk/client/tx');

describe('ng-rt-abci_test', function() {
  const engine = require('./helper');

  before(async() => {
    let result = false;
    while (result === false) {
      result = await engine.init();
    }
  });

  it('Create', done => {
    done();
  });

  it('/ng-rt-abci-server/info status 200 : ', function(done) {
    chai.request('http://localhost:8443')
      .get('/ng-rt-abci-server/info')
      .end(function(err, res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.tmStatus).to.equal("Tendermint active");
        expect(res.body.abciPort).to.equal("26658");
        done();
      });
  });
});

describe('TM integration', function() {
  const engine = require('./helper');

  before(async () => {
    let result = false;
    while (result === false) {
      result = await engine.init();
    }
    return;
  });

  it('Create a new unique transaction', done => {
    let operation = 'create';
    let digitalAsset = {
      firstAttr: 'Value1',
      secondAttr: 'Value9',
      thirdAttr: 'Value3'
    };
    let pubkey = "6NHUaZnJCCGFKgzpzg1fLrAkugb6QXNWpmXhz3ZzR564";
    let prvKey = "48RLk1S9FEj4V4vh95Az7DytfVhf9gVCYCdfabs8vUYYwyeead7HUKamXJQihcRa7Rg4HMNZT29CNVZwgECcmxGt";

    var obj = transaction.composeTx(operation, digitalAsset);
    logger.info(obj);
    var encoded = JSON.stringify(obj);
    var encode = Base64.encode(encoded);
    let signedTx = transaction.signTx(encode, pubkey, prvKey);
    var encodedResponse1 = JSON.stringify(signedTx);
    var encodedResponse = Base64.encode(encodedResponse1);

    let headers = {
      'Content-Type': 'text/plain',
      'Accept': 'application/json-rpc'
    };

    let options = {
      url: "http://localhost:26657",
      method: 'POST',
      headers: headers,
      json: true,
      body: {
        jsonrpc: "2.0",
        method: "broadcast_tx_sync",
        params: {
          tx: encodedResponse
        },
        id: "something"
      }
    };
    request(options, function(error, response, body) {
      logger.info(body);
      if (response.statusCode == 200) {
        expect(body.result.code).to.equal(0);
        expect(body.result.data).to.equal("");
        expect(body.result.log).to.equal("OK ");
        expect(body.result.hash).to.equal("C2827A4D3F66BAEE4C2F2FC57E0DACC40189D802");
      }
      if (error) logger.info(error);
    });
    done();
  });

  it('Create another unique transaction with sendTx-Manual decode ', done => {
    let operation = 'create';
    let digitalAsset = {
      firstAttr: 'Value1',
      secondAttr: 'Value2',
      thirdAttr: 'Value3'
    };
    let pubkey = "6NHUaZnJCCGFKgzpzg1fLrAkugb6QXNWpmXhz3ZzR564";
    let prvKey = "48RLk1S9FEj4V4vh95Az7DytfVhf9gVCYCdfabs8vUYYwyeead7HUKamXJQihcRa7Rg4HMNZT29CNVZwgECcmxGt";

    let obj = transaction.composeTx(operation, digitalAsset);
    logger.info(obj);
    let encoded = JSON.stringify(obj);
    let encode = Base64.encode(encoded);
    let signedTx = transaction.signTx(encode, pubkey, prvKey);
    let encodedResponse1 = JSON.stringify(signedTx);
    let encodedResponse = Base64.encode(encodedResponse1);
    transaction.sendTxAsync(encodedResponse).then(body => {
      expect(body.result.code).to.equal(0);
      expect(body.result.data).to.equal("");
      // expect(body.result.log).to.equal("OK ");
      expect(body.result.hash).to.equal("B6573214FE22D6DE13A61D17E2A0AE9C8ABC2A1B");
    });
    done();
  });

  it('Create another unique transaction with sendTx-auto decode ', done => {
    let operation = 'create';
    let digitalAsset = {
      firstAttr: 'Value1',
      secondAttr: 'Value3',
      thirdAttr: 'Value3'
    };
    let pubkey = "6NHUaZnJCCGFKgzpzg1fLrAkugb6QXNWpmXhz3ZzR564";
    let prvKey = "48RLk1S9FEj4V4vh95Az7DytfVhf9gVCYCdfabs8vUYYwyeead7HUKamXJQihcRa7Rg4HMNZT29CNVZwgECcmxGt";

    let obj = transaction.composeTxDecode(operation, digitalAsset);
    logger.info(obj);
    let signedTx = transaction.signTxDecode(obj, pubkey, prvKey);
    transaction.sendTxAsync(signedTx).then(body => {
      expect(body.result.code).to.equal(0);
      expect(body.result.data).to.equal("");
      // expect(body.result.log).to.equal("OK ");
      expect(body.result.hash).to.equal("DA953D2CA1BFF40FDFD59F5F5802ED8D65D6D133");
    });
    done();
  });

  it('Create another unique transaction with single sendData', done => {
    let operation = 'create';
    let digitalAsset = {
      firstAttr: 'Value1',
      secondAttr: 'Value4',
      thirdAttr: 'Value3'
    };
    let pubkey = "6NHUaZnJCCGFKgzpzg1fLrAkugb6QXNWpmXhz3ZzR564";
    let prvKey = "48RLk1S9FEj4V4vh95Az7DytfVhf9gVCYCdfabs8vUYYwyeead7HUKamXJQihcRa7Rg4HMNZT29CNVZwgECcmxGt";

    transaction.sendDataDecode(operation, digitalAsset, pubkey, prvKey).then(body => {
      expect(body.result.code).to.equal(0);
      expect(body.result.data).to.equal("");
      // expect(body.result.log).to.equal("OK ");
      expect(body.result.hash).to.equal("49C75D85B4EED963B11461EFCDCAB0D39936E248");
    });
    done();
  });

  it('Error - Already in cache', done => {
    let operation = 'create';
    let digitalAsset = {
      firstAttr: 'Value1',
      secondAttr: 'Value9',
      thirdAttr: 'Value3'
    };
    let pubkey = "6NHUaZnJCCGFKgzpzg1fLrAkugb6QXNWpmXhz3ZzR564";
    let prvKey = "48RLk1S9FEj4V4vh95Az7DytfVhf9gVCYCdfabs8vUYYwyeead7HUKamXJQihcRa7Rg4HMNZT29CNVZwgECcmxGt";

    var obj = transaction.composeTx(operation, digitalAsset);

    var encoded = JSON.stringify(obj);
    var encode = Base64.encode(encoded);
    let signedTx = transaction.signTx(encode, pubkey, prvKey);
    var encodedResponse1 = JSON.stringify(signedTx);
    var encodedResponse = Base64.encode(encodedResponse1);

    let headers = {
      'Content-Type': 'text/plain',
      'Accept': 'application/json-rpc'
    };

    let options = {
      url: "http://localhost:26657",
      method: 'POST',
      headers: headers,
      json: true,
      body: {
        jsonrpc: "2.0",
        method: "broadcast_tx_sync",
        params: {
          tx: encodedResponse
        },
        id: "something"
      }
    };
    request(options, function(error, response, body) {
      logger.info(body);
      expect(body.error.message).to.equal("Internal error");
      expect(body.error.data).to.equal("Error broadcasting transaction: Tx already exists in cache");
      if (error) logger.info(error);
      done();
    });
  });
});
