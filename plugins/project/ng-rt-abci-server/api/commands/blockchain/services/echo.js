// 'use strict';

// const logger = require('log4js').getLogger('commands.blockchain.services.echo');
// //define a function inorder to stub in unit tests
// module.exports = {
//   echo : function (services,request){
//     logger.debug('commands.blockchain.services.echo');
//   logger.debug('request : ', request);
//   return {
//     code: 0,
//     log: 'Echo executed'
//   };
// }
// };

'use strict';

const logger = require('log4js').getLogger('commands.blockchain.services.echo');

module.exports = (services, request) => {
  logger.debug('commands.blockchain.services.echo');
  logger.debug('request : ', request);
  return {
    code: 0,
    log: 'Echo executed'
  };
};
