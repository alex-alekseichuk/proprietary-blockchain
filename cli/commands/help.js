'use strict';
const bold = require("cli-colors").bold;

/**
 * Return help text
 * @return {string} helpText return the value of the help text
 */
function help() {
  let helpText = bold("Usage:") + "\n" +
    "   Blockchain Solution Platform <command> [args] [help]\n\n" +
    bold("Description:") + "\n" +
    "   Blockchain Solution Platform command-line cli\n\n" +
    bold("Commands:\n") +
    "   configure [--silent]\n" +
    "   copyright\n" +
    "   init [--all, --silent, --logs , --datasources, --nodeModules, --flows, --plugins, --customPlugins," +
    " --database, --configFile]\n" +
    "   info\n" +
    "   isonline\n" +
    "   run [--npm, --loglevel, --skipAllConnectivityTests," +
    " --skipConnectivityTestRabbitMQ, --skipConnectivityTestMongoDB, --skipConnectivityTestBigchainDB, --config-file]\n" +
    "   show-config\n" +
    "   show-pubkey\n" +
    "   stop\n" +
    "   test-connectivity [--skipAllConnectivityTests, --skipConnectivityTestRabbitMQ," +
    " --skipConnectivityTestMongoDB --skipConnectivityTestBigchainDB]\n" +
    "   version\n";
  return helpText;
}

/**
 * Show the help text
 */
function show() {
  const helpText = help();
  /* eslint-disable no-console */
  console.log(helpText);
}

module.exports.getHelpText = help;
module.exports.show = show;
