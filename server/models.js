/**
 * Interface to models.
 * Implementation by loopback models system.
 */
'use strict';
module.exports = httpService => {
  return httpService.app.models;
};
