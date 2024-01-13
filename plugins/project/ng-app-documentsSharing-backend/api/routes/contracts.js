"use strict";

const logger = require('log4js').getLogger('assetExplorer/controllers/contracts/ContractsCtrl');
const Promise = require('bluebird');
const r = require('rethinkdb');

/* global deferred */

/**
 * @param {Object} configService - service's factory
 * @return {Object} {
 * {api:
 *    {
 *    contract: {
 *
 *    @param {Object} user - user's object, which should contain id field
 *    @return {Object} contract for passed user
 *      get: api.contract.get
 *      },
 *    memory: {
 *
 *    @param {Object} contracts - user's contracts
 *    @return {Object} contracts with restracted accessLog
 *    build: api.memory.build,
 *
 *    @param {String} address - contract's id
 *    @return {Object} contract
 *    get: api.memory.get
 *      }
 *    }
 * }
 *}
 */
module.exports = configService => {
  return {
    get: fileid => {
      return r.connect({
        host: configService.get('rethinkHost'),
        port: configService.get('rethinkPort')
      })
        .then(connection =>
          new Promise((res, rej) => {
            r.db('bigchain').table('bigchain').map(item =>
              item('block')('transactions')('asset')('data')
            )
              .filter(
                r.row.count().gt(0)
              )
              .concatMap(item => item)
              .filter(
                r.and(
                  r.row('memory')('documentId').default('').eq(fileid),
                  r.or(
                    r.row('eventType').default('').eq('contractUpdate')
                      .and(r.row('functionName').eq('getSecretSecret')),
                    r.row('eventType').default('').eq('contractUpdate')
                      .and(r.row('functionName').eq('saveSecretSecret'))
                  )
                )
              )
              .group('address')
              .ungroup()
              .map(group =>
                group('reduction')
                  .filter(item =>
                    item('functionName').eq('saveSecretSecret'))(0)('memory')
                  .merge({
                    accessLog: r.branch(
                      group('reduction')
                        .filter(item => item('functionName').eq('getSecretSecret')).isEmpty(),
                      [],
                      group('reduction')
                        .orderBy(r.desc(item => item('memory')('accessLog').count()))
                        .filter(item => item('functionName').eq('getSecretSecret'))(0)('memory')('accessLog')
                    )
                  })
                  .without('mailKeyHash', 'serversList')
              )
              .default([])
              .run(connection, (err, cursor) => {
                if (!cursor || err) {
                  return Promise.reject("no data");
                }

                cursor.toArray((err, result) => err ? rej(err) : res(result));
              });
          })
        )
        .then(data => {
          return Promise.resolve(data);
        })
        .catch(err => {
          logger.error("Error: " + err);
          deferred.reject(err);
        });
    }
  };
};
