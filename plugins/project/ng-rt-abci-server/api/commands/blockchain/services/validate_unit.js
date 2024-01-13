/**
 * Test abci transaction
 */
'use strict';
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
const chai = require('chai');
chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(sinonChai);
var rewire = require("rewire");
let myModule = rewire('./validate');
const expect = chai.expect;
const validate = require('./validate');
const testData = require('../../../../test/testData.js');
const testTransaction = require('../../../../test/testTransaction');
const doubleSpend = require('../../../../test/doubleSpendData');

describe('validate', () => {
  beforeEach(() => { });

  it("Should have property", function() {
    validate.should.have.property('validateTx');
  });

  // fails if operation is not available
  it('fails if operation doesnt exists', async function() {
    let models = testData.services.get('loopbackApp').models;
    let res = testTransaction.txOperation.tx;
    await expect(validate.validateTx(models, res)).to.be.rejected;
  });

  // check and validate hash, fails if hash of the transaction hash is different
  it('check and validate hash of the transaction', async function() {
    let res = testTransaction.txvalidateHash.tx;
    let validateTxHash = myModule.__get__('validateTxHash');

    // Same tx produces same hash
    let isvalid = await validateTxHash(res);
    expect(isvalid).to.be.true;

    // validate hash fails as metadata changes (Different tx produces different hash)
    res.metadata = 'testing';
    await expect(validateTxHash(res)).to.be.rejected;

    // validate hash pass, metadata set to its original value (same tx produces same hash)
    res.metadata = {};
    isvalid = await validateTxHash(res);
    expect(isvalid).to.be.true;
  });

  // check duplicate txIds
  it('check duplicate txIds true', async function() {
    let models = testData.services.get('loopbackApp').models;
    let res = testTransaction.txvalidateHash.tx;
    let checkDupIds = myModule.__get__('checkDupTxIds');

    let isvalid = await checkDupIds(models, res);
    expect(isvalid).to.be.true;
  });

  // check duplicate txIds
  it('check duplicate txIds false', async function() {
    let models = testData.services.get('loopbackApp').model;
    let res = testTransaction.txvalidateHash.tx;
    let checkDupIds = myModule.__get__('checkDupTxIds');
    await expect(checkDupIds(models, res)).to.be.rejected;
  });

  // return Error message if tx is already exists in database (CREATE tx with already used tx is invalid)
  it('validate create transaction throws an error if tx already exists in database', async function() {
    let models = testData.services.get('loopbackApp').model;
    let tx = testTransaction.txCreate.tx;
    await expect(validate.validateTx(models, tx)).to.be.rejected;
  });

  // return true if tx does not exists in database
  it('validate create transaction pass if tx does not exists', async function() {
    let models = testData.services.get('loopbackApp').models;
    let tx = testTransaction.txvalidateHash.tx;
    let result = await validate.validateTx(models, tx);
    expect(result).to.be.true;
  });

  // check and validate transfer transaction, fails because txId doesnt exists in the database
  it('validate transfer transaction throw error if txId doesnt exists', async function() {
    let models = testData.services.get('loopbackApp').models;
    let tx = testTransaction.txTransfer.tx;
    await expect(validate.validateTx(models, tx)).to.be.rejected;
  });

  // return true if conditions are true
  it('check checkTransferInputConditions', async function() {
    let tx = testTransaction.txTransfer.tx;
    let checkTransferInputConditions = myModule.__get__('checkTransferInputConditions');
    let result = await checkTransferInputConditions(tx, testTransaction.txCreate.tx.outputs);
    expect(result).to.be.true;
  });

   // return true if conditions are true
   it('check checkTransferInputConditions:: invalid conditionURI', function() {
    let tx = testTransaction.txTransfer.tx;
    let invalidUriCondtions = [{
      condition: {
        details: {
          type: "ed25519-sha-256",
          public_key: "2yDPkjVAmEFdmEZ7HedU8qZMbaxcD6vA2FbuxAhWa5AK"
        },
        uri: "ni:///sha-256;VmJX7zteZqMMNDNZ8-0wvfsRWLKL_d0lByqQfjkVA?fpt=ed25519-sha-256&cost=131072"
      },
      amount: "100",
      public_keys: [
        "2yDPkjVAmEFdmEZ7HedU8qZMbaxcD6vA2FbuxAhWa5AK"
      ]
    }]
    let checkTransferInputConditions = myModule.__get__('checkTransferInputConditions');
    let result = async function () {await checkTransferInputConditions(tx, invalidUriCondtions)};
    expect(result).to.throw;
  });

  // validate validateCreateTx
  it('validate create transaction', async function() {
    let models = testData.services.get('loopbackApp').models;
    let validateCreateTx = myModule.__get__('validateCreateTx');
    let tx = testTransaction.txvalidateHash.tx;
    let result = await validateCreateTx(models, tx);
    expect(result).to.be.true;
  });

  // check doubleSpend (transfer from Alice to 3rd person as asset is already being transferred to bob)
  it('validate double spend transaction case 1', async function() {
    let models = testData.invalidServices.get('loopbackApp').models;
    let fakeResult = sinon.fake.returns('true');
    myModule.__set__("checkDupTxIds", fakeResult);
    myModule.__get__("checkDupTxIds");
    let validateTransferTx = myModule.__get__('validateTransferTx');
    let tx = doubleSpend.doubleSpend.tx;
    await expect(validateTransferTx(models, tx)).to.be.rejected;
  });

  // check doubleSpend (transfer from Alice to bob 2 times)
  it('validate double spend transaction case 2', async function() {
    let models = testData.invalidServices.get('loopbackApp').models;
    let fakeResult = sinon.fake.returns('true');
    myModule.__set__("checkDupTxIds", fakeResult);
    myModule.__get__("checkDupTxIds");
    let validateTransferTx = myModule.__get__('validateTransferTx');
    let tx = doubleSpend.doubleSpendTx.tx;
    await expect(validateTransferTx(models, tx)).to.be.rejected;
  });
  // check and validate transfer transaction
  it('validate transfer transaction pass', async function() {
    let models = testData.services.get('loopbackApp').model;
    let fakeResult = sinon.fake.returns('true');
    myModule.__set__("checkDupTxIds", fakeResult);
    myModule.__get__("checkDupTxIds");
    let tx = testTransaction.transferPass.tx;
    let validateTransferTx = myModule.__get__('validateTransferTx');
    let result = await validateTransferTx(models, tx);
    expect(result).to.be.true;
  });

  // checKSpentTx
  it('checkspent tx if tx already spent', async function() {
    let models = testData.invalidServices.get('loopbackApp').models;
    let checkSpentTx = myModule.__get__('checkSpentTx');
    let tx = doubleSpend.doubleSpend.tx;
    await expect(checkSpentTx(models, tx.inputs[0].fulfills.transaction_id, tx.inputs[0].fulfills.output_index, tx.inputs[0].owners_before[0], [])).to.be.rejected;
  });

  // checKSpentTx
  it('checkspent tx if tx is unspent', async function() {
    let models = testData.services.get('loopbackApp').model;
    let checkSpentTx = myModule.__get__('checkSpentTx');
    let tx = testTransaction.transferPass.tx;
    let result = await checkSpentTx(models, tx.inputs[0].fulfills.transaction_id, tx.inputs[0].fulfills.output_index, tx.inputs[0].owners_before[0], []);
    expect(result).to.be.true;
  });
});
