"use strict";

const logger = require("log4js").getLogger(
  "commands.blockchain.services.endBlock"
);
const {INFO, CODE} = require("../../../../config/abciResponse.js");

module.exports = async (services, request, validatorUpdates) => {
  logger.debug("commands.blockchain.services.endBlock");
  logger.debug("End Block request : ", request);
  const metricsClient = services.get("metricsClient");
  try {
    if (validatorUpdates.length > 0) {
      metricsClient.increment("EndBlock, reqType=valUpdateReq");
      return {
        code: CODE.ok,
        log: `End Block ${INFO.success}`,
        validatorUpdates: validatorUpdates
      };
    }
    metricsClient.increment("EndBlock");
    return {
      code: CODE.ok,
      log: `End Block ${INFO.success}`
    };
  } catch (err) {
    metricsClient.increment(`EndBlock, error=${err.message}`);
    return {
      code: CODE.fail,
      log: `End Block ${INFO.failure}: ${err.message}`
    };
  }
};
