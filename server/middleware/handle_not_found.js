'use strict';

module.exports = options => {
  return function handleNotFound(req, res, next) {
    res.status(404)
      .sendFile('not_found.html', {root: __dirname});
  };
};
