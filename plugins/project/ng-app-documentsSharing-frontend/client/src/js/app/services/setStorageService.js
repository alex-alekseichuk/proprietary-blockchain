"use strict";

/* eslint-disable no-unused-vars */

/**
 * return provider based on provided name
 * @param {String} storageName - provider's name
 * @ignore
 */
const setStorage = function(storageName) {
  this.storageName = storageName;
  this.$.lstStorages.selected = (this.providers || []).indexOf(storageName);
};
