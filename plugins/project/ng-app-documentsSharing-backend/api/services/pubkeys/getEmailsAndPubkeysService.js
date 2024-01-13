"use strict";

const Promise = require('bluebird');
const _ = require('lodash');

/**
 *
 * @type {service}
 * @param {Object} models - model's instance
 * @param {Object} recipients - pubkeys of users in format - pubKey: his_key
 * @return {Object} Promise
 */
module.exports = (models, recipients) => {
  return Promise.all(
    _.map(recipients, r =>
      models.uiObserver.notifyObserversOf("DS_getEmail_and_Pubkey", {key: r.pubKey})
    )
    )
    .then(ctxs => {
      return Promise.resolve(
        _.transform(ctxs, (acc, ctx) => {
          if ((ctx.recepient && !ctx.key) || (!ctx.recepient && !ctx.pubkey)) {
            return acc.unknown_emails.push(ctx.recepient || ctx.key);
          }

          acc.result.push(
            ctx.recepient ?
            {pubKey: ctx.key, email: ctx.recepient} :
            {pubKey: ctx.pubkey, email: ctx.key}
          );
        }, {
          unknown_emails: [],
          result: []
        })
      );
    });
};
