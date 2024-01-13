/**
 * ACL item
 */
'use strict';

const _ = require('lodash');
const logger = require('log4js').getLogger('authorisation');

module.exports = authorisation => {
  // toID          scope   domainId  subDomainId  objId   objType     subObjId    subObjType  allow:Boolean /CRUD
  //* *********************************************************************************************
  // admin         user                           *       dommain                             true
  // user02        user                           D01     dommain                             true
  // user02        user    D01       SD01         C01     customer                            false
  // user02        user    D01       SD01         C02     customer                            false
  // user          role                           D01     dommain                             true
  //
  // admin         role                           D02     dommain                             true
  // user          role                           D02     dommain                             true
  // user01        user                           D02     dommain                             true
  // user02        user                           D02     dommain                             true
  // user02        user    *         SD01         Screen1 Screen                              false
  // user          role    D01       *            Screen1 Screen      Profile     Tab         false
  // user          role    D01       *            Screen1 Screen      CustName    Field       false

  // How to handle '*' ??? That should be handled by a %

  authorisation.checkAuthorisation = (objType, objId, userInfo, cb) => {
    logger.debug('Executing checkAuthorisation');
    logger.debug('objType : ', objType);
    logger.debug('objId : ', objId);
    logger.debug('userInfo.username : ', userInfo.username);
    logger.debug('userInfo.roles : ', userInfo.roles);

    authorisation.find({
      where: {
        objType: objType,
        objId: objId,
        or: [
          {scope: 'user', toId: userInfo.username},
          {scope: 'role', toId: {inq: userInfo.roles}},
          {scope: 'all'}
        ]
      },
      fields: {
        allow: true,
        scope: true
      }
    })
      .then(rows => {
        logger.debug('rows : ', rows);
        /* eslint-disable operator-linebreak */
        // byUser + [(byRoles + [forAll - !byRoles]) - !byUser]
        const allowed = (
          _.find(rows, r => r.scope === 'user' && r.allow)
          ||
          (
            (
              _.find(rows, r => r.scope === 'role' && r.allow)
              ||
              (
                _.find(rows, r => r.scope === 'all' && r.allow)
                &&
                !_.find(rows, r => r.scope === 'role' && !r.allow)
              )
            )
            &&
            !_.find(rows, r => r.scope === 'user' && !r.allow)
          )
        );
        cb(null, allowed);
      });
  };

  /*
   //disable all remote methods
   authorisation.sharedClass.methods().forEach(function(method) {
   authorisation.disableRemoteMethod(method.name, method.isStatic);
   });
   */

  authorisation.remoteMethod(
    'checkAuthorisation', {
      accepts: [{
        arg: 'objType',
        type: 'string',
        required: true
      }, {
        arg: 'objId',
        type: 'string',
        required: true
      }, {
        arg: 'userInfo',
        type: 'string',
        required: true
      }],
      returns: {
        arg: 'result',
        type: 'object'
      },
      http: {
        verb: 'get'
      }
    }
  );
};
