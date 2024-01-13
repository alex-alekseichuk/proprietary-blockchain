/**
 * Interface to rethinkdb.
 * @module API/Service/RethinkDB
 * @type {object}
 */
'use strict';
const logger = require('log4js').getLogger('rethinkdb');
const r = require('rethinkdb');

const DB = 'bigchain';
const TABLE = 'bigchain';

let conn = null;
let conf = null;

/**
 * Connect to RethinkDB database
 * @param  {object} config Configs
 * @return {object}        Connec tion
 */
const connect = config => {
  logger.trace('Trying to connect to RethinkDB :');
  conf = config;
  return r.connect({
    host: config.get('rethinkHost'),
    port: config.get('rethinkPort')
  }).then(connection => {
    logger.info('Successfully connected to RethinkDB');
    conn = connection;
    conn.use(DB);
    return conn;
  }).catch(err => {
    logger.error("Can't connect to RethinkDB: " + err);
    return Promise.reject(err);
  });
};

const checkConnection = () => {
  return new Promise((resolve, reject) => {
    if (conn && conn.open && !conn.closing) {
      return resolve(conn);
    }
    logger.error('Rethinkdb connection expired');
    return resolve(connect(conf));
  });
};

const _checkConn = () => {
  if (!conn) {
    logger.error("find: no rethinkdb connection");
    throw new Error('no rethinkdb connection');
  }
};

/**
 * findCursor
 * @param  {object} options Query details
 * @return {promise}        Cursor for bigchaindb table
 */
const findCursor = options => {
  // _checkConn();
  return checkConnection()
    .then(() => {
      let query = r.table(options.table || TABLE);
      if (options.filter)
        query = options.filter(r, query);
        // query = query.filter(options.filter(r));
      if (options.fields)
        query = query.pluck.apply(query, options.fields);
      return query.run(conn)
        .catch(err => {
          logger.error("findCursor: can't run query " + JSON.stringify(options) + " " + err.message);
        });
    })
    .catch(err => logger.error(err));
};

/**
 * find some blocks in the bigchain table
 * @param {object} options query details
 * @return {Promise.<Array>} resultset
 */
const find = options => {
  return findCursor(options)
    .then(cursor => {
      // if there is no special item processing
      if (!options.each)
        // then just return array of items
        return cursor.toArray();

      // process each item in the cursor
      return new Promise(resolve => {
        const ctx = {result: []};
        cursor.each(function(err, item) {
          if (err)
            throw err;
          if (item < 0) {
            cursor.close();
            return false;
          }
          options.each(ctx, item);
        }, function() {
          resolve(ctx.result);
        });
      });
    })
    .catch(err => {
      logger.error("find: " + err.message);
    });
};

/**
 * Remove records from RethinkDB
 * @param  {object} options Query details
 * @return {undefined}
 */
const remove = options => {
  _checkConn();
  let query = r.table(TABLE);
  if (options && options.filter)
    query = options.filter(r, query);
  return query.delete().run(conn)
    .catch(err => {
      logger.error("empty:", err.message);
    });
};

module.exports = {
  connect: connect,
  find: find,
  findCursor: findCursor,
  remove: remove
};
