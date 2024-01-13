'use strict';
module.exports = {
  activate: (server, plugin) => {
    const pluginSettings = server.plugin_manager.configs.get(plugin);
    if (pluginSettings.get('isInit'))
      return;
    pluginSettings.set('isInit', true);
    pluginSettings.save();

    server.models.dataSource.destroyAll({
      name: "ng-rt-smart-contracts"
    }, function() {
      server.models.dataSource.create({
        name: 'ng-rt-smart-contracts',
        useDefaultConnection: true,
        databasePrefix: "default",
        database: "ng_rt_smart_contracts"
      });
    });
  },
  deactivate: (server, plugin) => {}
};
