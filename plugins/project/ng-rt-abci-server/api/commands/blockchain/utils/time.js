'use strict';
/**
 * Utility function to covert Unix based timestamp
 * @param {object} timeStamp Unix timestamp
 * @return {object} date Time in gregoian format
 */
function convertTimeStampToUTC(timeStamp) {
  let date = (new Date(timeStamp * 1000)).toUTCString();
  return date;
}

module.exports = {
  convertTimeStampToUTC
};
