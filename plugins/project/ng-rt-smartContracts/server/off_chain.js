'use strict';

const loopback = require('loopback');

const OffChainModel = loopback.findModel("localIsolatedMemory");

module.exports = function(configService) {
  this.configService = configService;

  this.save = (key, value) => OffChainModel.create({key, value});

  this.get = key => OffChainModel.findOne({where: {key}});

  this.update = (key, value) => OffChainModel.updateAll({key}, {value});

  this.delete = key => OffChainModel.destroyAll({where: {key}});
};
