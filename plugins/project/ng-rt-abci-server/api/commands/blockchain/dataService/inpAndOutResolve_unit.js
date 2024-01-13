 /**
  * Test abci transaction
  */
 'use strict';

 const sinonChai = require("sinon-chai");
 const chai = require('chai');
 chai.should();
 const chaiAsPromised = require('chai-as-promised');
 chai.use(chaiAsPromised);
 chai.use(sinonChai);
 const expect = chai.expect;
 const inpAndOutResolve = require('./inpAndOutResolve');

 describe('resolve inputs and outputs', () => {
   beforeEach(() => {});

   it("Should have property", function() {
     inpAndOutResolve.should.have.property('resolveInputs');
     inpAndOutResolve.should.have.property('resolveOutputs');
   });

   it('resolveOutputs', async function() {
     let txId = '26a58581c462a7ce8caadc201ab3cf9eb0e3e4b583c2dc77ab23a7ff4d66a9fc';
     let operation = 'CREATE';
     let outputs = [
       {
         condition: {
           details: {
             type: "ed25519-sha-256",
             public_key: "2yDPkjVAmEFdmEZ7HedU8qZMbaxcD6vA2FbuxAhWa5AK"
           },
           uri: "ni:///sha-256;VmJX7zteZqMMKANDNZ8-0wvfsRWLKL_d0lByqQfjkVA?fpt=ed25519-sha-256&cost=131072"
         },
         amount: "100",
         public_keys: [
           "2yDPkjVAmEFdmEZ7HedU8qZMbaxcD6vA2FbuxAhWa5AK"
         ]
       },
       {
         condition: {
           details: {
             type: "ed25519-sha-256",
             public_key: "7dH6iWxQdfNptmNBeEUGiM4g8ayeD8Q2JLUjwvWDeb46"
           },
           uri: "ni:///sha-256;VmJX7zteZqMMKANDNZ8-0wvfsRWLKL_d0lByqQfjkVA?fpt=ed25519-sha-256&cost=131072"
         },
         amount: "100",
         public_keys: [
           "7dH6iWxQdfNptmNBeEUGiM4g8ayeD8Q2JLUjwvWDeb46"
         ]
       }
     ];
     let response = await inpAndOutResolve.resolveOutputs(txId, operation, outputs);
     expect(response.length).to.be.equal(2);

     expect(response[0]).to.have.property('outputIndex');
     expect(response[0]).to.have.property('operation');
     expect(response[0]).to.have.property('txId');
     expect(response[0]).to.have.property('type');
     expect(response[0]).to.have.property('public_key');
     expect(response[0]).to.have.property('uri');
     expect(response[0]).to.have.property('amount');
     expect(response[0]).to.have.property('public_keys');

     expect(response[1]).to.have.property('outputIndex');
     expect(response[1]).to.have.property('operation');
     expect(response[1]).to.have.property('txId');
     expect(response[1]).to.have.property('type');
     expect(response[1]).to.have.property('public_key');
     expect(response[1]).to.have.property('uri');
     expect(response[1]).to.have.property('amount');
     expect(response[1]).to.have.property('public_keys');
   });

   it('resolveInputs', function() {
     let txId = '26a58581c462a7ce8caadc201ab3cf9eb0e3e4b583c2dc77ab23a7ff4d66a9fc';
     let operation = 'CREATE';
     let inputs = [
       {
         fulfillment: "pGSAIB1COWlpY6KJi0lwsEXCTzlyJd1hyNeQPIThXyY5PWNkgUDjXpJtQ4i--RlarrE2Kc_tbCgB5EOOFQH22LWsP-SHcqFji-BxgF45puhhOuO8ou97BD6ojSHP90PYdPDadrIO",
         fulfills: {
           output_index: 0,
           transaction_id: "6ea5ee5df0fac37a1076d0afe3c2138151b3a44a507517cad33972e87b0f191e"
         },
         owners_before: [
           "2yDPkjVAmEFdmEZ7HedU8qZMbaxcD6vA2FbuxAhWa5AK"
         ]
       },
       {
         fulfillment: "pGSAIB1COWlpY6KJi0lwsEXCTzlyJd1hyNeQPIThXyY5PWNkgUDjXpJtQ4i--RlarrE2Kc_tbCgB5EOOFQH22LWsP-SHcqFji-BxgF45puhhOuO8ou97BD6ojSHP90PYdPDadrIO",
         fulfills: {
           output_index: 1,
           transaction_id: "6ea5ee5df0fac37a1076d0afe3c2138151b3a44a507517cad33972e87b0f191e"
         },
         owners_before: [
           "7dH6iWxQdfNptmNBeEUGiM4g8ayeD8Q2JLUjwvWDeb46"
         ]
       }
     ];
     let response = inpAndOutResolve.resolveInputs(txId, operation, inputs);
     expect(response.length).to.be.equal(2);

     expect(response[0]).to.have.property('inputIndex');
     expect(response[0]).to.have.property('operation');
     expect(response[0]).to.have.property('txId');
     expect(response[0]).to.have.property('fulfillment');
     expect(response[0]).to.have.property('owners_before');
     expect(response[0]).to.have.property('fulfills');

     expect(response[1]).to.have.property('inputIndex');
     expect(response[1]).to.have.property('operation');
     expect(response[1]).to.have.property('txId');
     expect(response[1]).to.have.property('fulfillment');
     expect(response[1]).to.have.property('owners_before');
     expect(response[1]).to.have.property('fulfills');
   });
 });
