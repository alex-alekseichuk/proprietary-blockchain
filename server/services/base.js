'use strict';
const logger = require('log4js').getLogger('services.base');

module.exports = BASE;
/**
 * Base class
 * @class
 */
function BASE() {
  // Call the BASE constructor
  logger.debug('Constructur of BASE');
  // BASE.apply(this, [].slice.call(arguments));
}

BASE.prototype.a = function() {
  var val1 = "Return Value of BASE *";
  return val1;
};

BASE.prototype.b = function() {
  throw new Error('Needs to be implemented in an extension');
};
BASE.prototype.aa = function() {
  logger.debug('****** from base ******');
};
