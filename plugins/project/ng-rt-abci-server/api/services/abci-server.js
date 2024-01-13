/* eslint-disable no-loop-func */
"use strict";

const abci = require("abci");

const logger = require("log4js").getLogger("ng-rt-abci-server.services.abci-server");
const {createUpdateHash} = require("../commands/blockchain/utils/sha");
const {INFO, CODE} = require("../../config/abciResponse");

module.exports = (services, pluginInstance) => {
  let pluginSettings = pluginInstance.config;
  let abciServerPort = pluginSettings.get("abciServerPort");
  let i18n = services.get("i18n");

  logger.debug(i18n.__("activate service abci-server"));

  const commands = require("../commands/blockchain");

  let transactions = [];
  let blocks = [];
  let tmLatestBlockInfo = [];
  let validatorUpdates = [];
  let currentTxs = [];

  const serverHandlers = {
    async beginBlock(request) {
      logger.debug(i18n.__("beginBlock : ", request));
      try {
        transactions = [];
        blocks = [];
        tmLatestBlockInfo = [];
        validatorUpdates = [];
        currentTxs = [];
        logger.debug("before beginBlock.exec");
        const blockId = await commands.beginBlock.exec(services, request);
        logger.debug("beginBlock", blockId);
        blocks = blockId.block;
        tmLatestBlockInfo = blockId.tmLatestBlock;
        logger.trace("Blocks Array :", blocks);
        logger.trace("tmLatestBlockInfo Array :", tmLatestBlockInfo);
        return {
          code: 0,
          log: "Begin block"
        };
      } catch (err) {
        logger.error(err);
      }
    },

    async checkTx(request) {
      logger.debug("check : ", request);
      let parsedTx = {}
      try {
        parsedTx = JSON.parse((request.tx).toString());
        const checkTxResult = await commands.checkTx.exec(services, parsedTx);
        logger.debug('Result of checkTx:', checkTxResult);
        return checkTxResult;
      } catch (err) {
        logger.error(err.message);
        const rabbitmqPublisher = services.get('ng-rt-abci-server-rabbitmq-publisherService');
        if (rabbitmqPublisher)
          rabbitmqPublisher.rejectedTx('CheckTx', parsedTx);
        return {
          code: CODE.fail,
          log: `CheckTx ${INFO.failure}`
        };
      }
    },

    async commit(request) {
      logger.trace("commit : ", request);
      logger.trace(transactions);
      try {
        const commitRes = await commands.commit.exec(
          services,
          request,
          blocks,
          tmLatestBlockInfo,
          transactions
        );
        logger.debug(`Commit Response: ${JSON.stringify(commitRes)}`);
        return commitRes;
      } catch (err) {
        logger.error(err.message);
        return {
          code: CODE.fail,
          log: `Commit ${INFO.failure}`
        };
      }
    },

    async deliverTx(request) {
      let parsedTx = {};
      try {
        logger.trace("delivertx : ", request);
        const stringifiedTx = (request.tx).toString();
        parsedTx = JSON.parse(stringifiedTx);
        // Calculate SHA256 Hash of the received Tx
        parsedTx.txTmHash = createUpdateHash(stringifiedTx);
        const res = await commands.deliverTx.exec(services, parsedTx, currentTxs);
        transactions.push(res.deliverTxRes.data); // pushing transactionIds to transactions array
        currentTxs.push(parsedTx);
        if (res.validator) validatorUpdates.push(res.validator);
        logger.debug(`DeliverTx Response: ${JSON.stringify(res.deliverTxRes)}`);
        return res.deliverTxRes;
      } catch (err) {
        logger.error(err.message);
        const rabbitmqPublisher = services.get('ng-rt-abci-server-rabbitmq-publisherService');
        if (rabbitmqPublisher)
          rabbitmqPublisher.rejectedTx('DeliverTx', parsedTx);
        return {
          code: CODE.fail,
          log: `DeliverTx ${INFO.failure}`
        };
      }
    },

    async endBlock(request) {
      logger.trace("endBlock : ", request);
      try {
        const endBlockRes = await commands.endBlock.exec(services, request, validatorUpdates);
        return endBlockRes;
      } catch (err) {
        logger.error(err);
      }
    },

    async echo(request) {
      logger.trace("echo : ", request);

      await commands.echo.exec(services, request);

      return {
        code: 0,
        log: "echo succeeded"
      };
    },

    async flush(request) {
      logger.trace("flush : ", request);

      await commands.flush.exec(services, request);

      return {
        code: 0,
        log: "flush succeeded"
      };
    },

    async info(request) {
      try {
        logger.debug("info : ", request);
        const lastBlockInfo = await commands.info.exec(services, request);
        logger.debug("lastBlockInfo : ", lastBlockInfo);
        return lastBlockInfo;
      } catch (err) {
        logger.error(err);
      }
    },

    async initChain(request) {
      logger.debug("initChain : ", request);

      await commands.initChain.exec(services, request);

      return {
        code: 0,
        log: "initChain succeeded"
      };
    },

    async query(request) {
      logger.trace("query : ", request);
      await commands.query.exec(services, request);

      return {
        code: 0,
        log: "query succeeded"
      };
    }
  };

  /**
   * Startup the ABCI Server
   * @return {Object} the abci server instance
   */
  function createAbciServer() {
    logger.info('createAbciServer');
    let server = abci(serverHandlers)
      .listen(`${abciServerPort}`, () => {
        logger.info(
          i18n.__(
            "PROJECT ABCI Server is trying to listen on port : ",
            server.address()
          )
        );
      })
      .on("error", e => {
        if (e.code === "EADDRINUSE") {
          logger.error(
            i18n.__(`Address ${abciServerPort} in use, retrying...`)
          );
          setTimeout(() => {
            server.close();
            server.listen(`${abciServerPort}`);
          }, 10000);
        }
      });
    return server;
  }

  return {
    createAbciServer,
    serverHandlers
  };
};
