'use strict';
module.exports = {
  activate: async (server, plugin) => {
    const pluginSettings = server.plugin_manager.configs.get(plugin);
    if (pluginSettings.get('isInit'))
      return;
    pluginSettings.set('isInit', true);
    pluginSettings.save();

    await server.models.dataSource.destroyAll({
      name: "ng-rt-dataDictionary"
    });
    await server.models.dataSource.create({
      name: 'ng-rt-dataDictionary',
      useDefaultConnection: true,
      databasePrefix: "default",
      database: "ng_rt_core"
    });
    await server.models.dataSource.destroyAll({
      name: "ng-rt-app"
    });
    await server.models.dataSource.create({
      name: 'ng-rt-app',
      useDefaultConnection: true,
      databasePrefix: "default",
      database: "ng_rt_app"
    });
    await server.models.dataSource.destroyAll({
      name: "ng-rt-logs"
    });
    await server.models.dataSource.create({
      name: 'ng-rt-logs',
      useDefaultConnection: true,
      databasePrefix: "default",
      database: "ng_rt_logs"
    });
  },
  deactivate: (server, plugin) => { }
};
