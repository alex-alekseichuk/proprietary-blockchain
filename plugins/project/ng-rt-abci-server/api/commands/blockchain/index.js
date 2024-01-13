'use strict';
const tmBeginBlock = require('./services/beginBlock');
const tmCheckTx = require('./services/checkTx');
const tmCommit = require('./services/commit');
const tmDeliverTx = require('./services/deliverTx');
const tmEcho = require('./services/echo');
const tmEndBlock = require('./services/endBlock');
const tmFlush = require('./services/flush');
const tmInitChain = require('./services/initChain');
const tmQuery = require('./services/query');
const tmInfo = require('./services/info');

module.exports = {
  info: {
    exec: tmInfo
  },
  beginBlock: {
    exec: tmBeginBlock
  },
  checkTx: {
    exec: tmCheckTx
  },
  commit: {
    exec: tmCommit
  },
  deliverTx: {
    exec: tmDeliverTx
  },
  echo: {
    exec: tmEcho
  },
  endBlock: {
    exec: tmEndBlock
  },
  flush: {
    exec: tmFlush
  },
  initChain: {
    exec: tmInitChain
  },
  query: {
    exec: tmQuery
  }
};
