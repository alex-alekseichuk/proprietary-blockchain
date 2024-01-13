'use strict';

module.exports = options => {
  return function handleError(err, req, res, next) {
    // @todo 2 modes: 1) return err; 2) log err, return error page
    res.send(err);
  };
};
