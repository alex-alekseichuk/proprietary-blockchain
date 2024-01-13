"use strict";
const logger = require("log4js").getLogger(
  "commands.blockchain.services.commit"
);
const tmBlockDS = require("../dataService/tmBlockDS");
const tmLatestBlockInformationDS = require("../dataService/tmLatestBlockInformationDS");
const crypto = require("crypto");

module.exports = async function (
  services,
  request,
  blocks,
  tmLatestBlockInfo,
  transactions
) {
  logger.trace("commands.blockchain.services.commit");
  logger.trace("request : ", request);
  logger.debug("request commit blocks", blocks);
  logger.debug("transactions :", transactions);
  let models = services.get("loopbackApp").models;
  const tmBlock = models.tmBlock;
  const tmLatestBlockInformation = models.tmLatestBlockInformation;

  logger.trace("Length : ", transactions.length);

  /**
   * Function to write new block with transaction
   * @param  {array} transactions transactions received from deliverTx
   * @return {json} return code 0 or -1
   */
  async function writeNewBlock(transactions) {
    let appHash;
    if (transactions.length > 0) {
      const algo = "sha256";
      let sha256 = crypto.createHash(algo);
      // valid or invalid transactions
      let sha256Update;
      for (let transaction of transactions) {
        sha256Update = sha256.update(transaction);
        logger.trace("TransactionHash :", transaction);
      }
      appHash = sha256Update.digest("Hex");
      blocks.block.appHash = appHash;
      tmLatestBlockInfo.block.appHash = appHash;
    } else {
      appHash = blocks.block.appHash;
    }
    await tmBlockDS.create(tmBlock, blocks, transactions);
    await tmLatestBlockInformationDS.writeLatestBlockInfo(
      tmLatestBlockInformation,
      tmLatestBlockInfo
    );
    return {
      data: Buffer.from(appHash, "hex"),
    };
  }
  
  return await writeNewBlock(transactions);
};