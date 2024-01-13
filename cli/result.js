/* eslint-disable no-console */
'use strict';
const bold = require("cli-colors").bold;

module.exports = {
  log: function(msg) {
    console.log(msg);
  },
  help: function(command) {
    let helpText = bold("Usage:") + "\n" +
            "   cli " + command.usage + "\n\n" +
            bold("Description:") + "\n" +
            "   " + command.description + "\n\n" +
            bold("Options:") + "\n" +
            (command.options ? "   " + command.options + "\n" : "") +
            "   h  help      display this help text and exit";
    console.log(helpText);
  }
};
