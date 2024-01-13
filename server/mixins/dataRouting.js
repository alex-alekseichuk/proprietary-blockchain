'use strict';

const configService = require('../backend/configService');
var dataRoutingService = require('../services/dataRoutingService')(configService);

module.exports = function(Model, options) {
  Model.observe('after save', async function(ctx) {
    var app = Model.app;
    await dataRoutingService.createDataRouting(ctx.instance, app);
    return;
  });

  // Model.observe('after delete', function(ctx) {
  //   // var app = Model.app;
  //   // dataRoutingService.deleteDataRouting(ctx, app);
  //   next();
  // });
};
