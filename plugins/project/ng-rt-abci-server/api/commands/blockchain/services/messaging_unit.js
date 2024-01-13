/**
 * Test messaging
 */
'use strict';

const chai = require('chai');
chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const messaging = require('./messaging');
const testData = require('../../../../test/testData.js');

describe('abci backend', () => {
  describe("messaging", () => {
    it("checks messaging.check on a transaction id", async () => {
      let jsonResponse = await messaging.send(testData.services, testData.stubRequest);
      jsonResponse.should.have.property('log').eql('OK ');
      jsonResponse.should.have.property('code').eql(0);
    });

    it("checks messaging.check - on error", async () => {
      let jsonResponse = await messaging.send('something', 'something');
      jsonResponse.should.have.property('log').eql('something went wrong');
      jsonResponse.should.have.property('code').eql(-1);
    });

    it("checks messaging.rabbitMQ on a transaction id", async () => {
      let jsonResponse = await messaging.rabbitMQ();
      jsonResponse.should.be.true;
    });
    it("checks messaging.eventEmitter on a transaction id", async () => {
      let jsonResponse = await messaging.msgEventEmmitter();
      jsonResponse.should.be.true;
    });
  });
});
