"use strict";

const logger = require("log4js").getLogger(
  "commands.blockchain.utils.validatorUpdate"
);
const {
  findOne,
  deleteByFilter,
  updateValidator
} = require("../dataService/dataHandler");

const isValidUpdate = async (validatorSetModel, validator) => {
  const _filter = {where: {"pubKey.data": validator.pubKey.data}};
  const validatorObj = await findOne(validatorSetModel, _filter);
  if (validatorObj && validatorObj.power === validator.power) {
    throw new Error("Requested power is same as existing power");
  }
  const MAX_VOTING_POWER = 1.1529215e18; // TotalVotingPower = MaxInt64 / 8 (Tendermint 0.30.0)
  const reducer = (accumulator, currentValue) => accumulator + currentValue;
  const currentValidatorSet = await validatorSetModel.find();
  const currentTotalVotingPower = currentValidatorSet
    .filter(currentVal => currentVal.pubKey.data != validator.pubKey.data)
    .map(validator => validator.power)
    .reduce(reducer, 0);

  if (
    MAX_VOTING_POWER <= validator.power ||
    // validator.power >= (2 / 3) * currentTotalVotingPower ||
    MAX_VOTING_POWER < validator.power + currentTotalVotingPower
  ) {
    throw new Error("Requested power/new Total Voting Power of network exceeds MAX_VOTING_POWER");
  }
  return true;
};

const validatorUpdate = async (validatorReq, validatorSetModel) => {
  try {
    const {pubKey, power} = validatorReq;

    if (power === 0) {
      const _filter = {where: {"pubKey.data": pubKey.data}};
      const validatorObj = await findOne(validatorSetModel, _filter);
      if (validatorObj) {
        const _filter = {"pubKey.data": pubKey}; // omit "where" for delete filter
        await deleteByFilter(validatorSetModel, _filter);
        logger.debug(`Database: Validator ${pubKey.data} removed`);
        return {
          pubKey: {
            type: pubKey.type,
            data: pubKey.data
          },
          power: power
        };
      }
      throw new Error(
        `Validator: ${pubKey.data} does not exist to be removed!`
      );
    }
    let validators = [];
    validators.push(validatorReq);
    // update validator
    await isValidUpdate(validatorSetModel, validatorReq).then(res => {
      if (res === true) {
        return updateValidator(validatorSetModel, validators);
      }
      throw Error(res);
    });

    return {
      pubKey: {
        type: pubKey.type,
        data: pubKey.data
      },
      power: power
    };
  } catch (err) {
    throw Error(err);
  }
};

module.exports = {
  validatorUpdate
};
