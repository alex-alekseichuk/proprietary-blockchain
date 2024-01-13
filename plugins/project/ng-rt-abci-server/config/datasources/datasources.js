'use strict';
module.exports = {
  activate: (server, plugin) => {
    const pluginSettings = server.plugin_manager.configs.get(plugin);
    if (pluginSettings.get('isInit'))
      return;
    pluginSettings.set('isInit', true);
    pluginSettings.save();

    server.models.dataSource.destroyAll({
      name: "ng-rt-bc-offchain"
    }, function() {
      server.models.dataSource.create({
        name: 'ng-rt-bc-offchain',
        useDefaultConnection: true,
        databasePrefix: "default",
        database: "ng_rt_bc_offchain"
      });
    });
    server.models.dataSource.destroyAll({
      name: "ng-rt-bc-private"
    }, function() {
      server.models.dataSource.create({
        name: 'ng-rt-bc-private',
        useDefaultConnection: true,
        databasePrefix: "default",
        database: "ng_rt_bc_private"
      });
    });
    server.models.dataSource.destroyAll({
      name: "ng-rt-bc-public"
    }, function() {
      server.models.dataSource.create({
        name: 'ng-rt-bc-public',
        useDefaultConnection: true,
        databasePrefix: "default",
        database: "ng_rt_bc_public"
      });
    });
  },
  deactivate: (server, plugin) => {}
};
