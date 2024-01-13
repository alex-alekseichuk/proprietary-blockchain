'use strict';
/* eslint no-use-before-define: 0 */
var logger = require('log4js').getLogger('set-memory-field');

module.exports = function(RED) {
  /**
   *
   * @param {*} config Config
   */
  function saveMemory(config) {
    logger.debug('register set-memory-field module');
    RED.nodes.createNode(this, config);

    this.on('input', function(msg) {
      var field = config.field;
      var source = config.source;
      var reverse = config.reverse;

      if (reverse == "false") {
        reverse = false;
      }

      logger.debug(source, " >>> ", field);

      if (source) {
        source = source.split(".");
        var value;
        if (source.length == 2) {
          value = msg[source[0]][source[1]];
        } else {
          value = msg[source[0]];
        }

        logger.debug("memory value:");
        logger.debug(value);

        msg.memory[field] = value;
      } else if (reverse) {
        msg.memory[field] = !msg.memory[field];
      } else {
        msg.memory[field] = msg.payload;
      }

      msg.memoryChanged = true;

      this.send(msg);
    });
  }

  RED.nodes.registerType("set-memory-field", saveMemory);
};
