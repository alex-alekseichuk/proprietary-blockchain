"use strict";

module.exports = async configService => {
  await configService.clear();
  await configService.clearInDb();
};
