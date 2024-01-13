'use strict';

const resolveOutputs = (txId, operation, outputs) => {
  let flatOutputs = {};
  let txOutput = [];
  for (let i = 0; i < outputs.length; i++) {
    flatOutputs.outputIndex = i;
    flatOutputs.operation = operation;
    flatOutputs.txId = txId;
    flatOutputs.type = outputs[i].condition.details.type;
    flatOutputs.public_key = outputs[i].condition.details.public_key;
    flatOutputs.uri = outputs[i].condition.uri;
    flatOutputs.amount = outputs[i].amount;
    flatOutputs.public_keys = outputs[i].public_keys;
    txOutput.push(flatOutputs);
    flatOutputs = {};
  }
  return txOutput;
};

const resolveInputs = (txId, operation, inputs) => {
  let flatInputs = {};
  let txInput = [];
  for (let i = 0; i < inputs.length; i++) {
    flatInputs.inputIndex = i;
    flatInputs.operation = operation;
    flatInputs.txId = txId;
    flatInputs.fulfillment = inputs[i].fulfillment;
    flatInputs.fulfills = inputs[i].fulfills;
    flatInputs.owners_before = inputs[i].owners_before;
    txInput.push(flatInputs);
    flatInputs = {};
  }
  return txInput;
};

module.exports = {
  resolveInputs,
  resolveOutputs
};
