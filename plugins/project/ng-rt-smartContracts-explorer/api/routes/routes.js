'use strict';

const path = require('path');

/**
* API/Route/ng-rt-smart-contracts-explorer
*
* @module API/Route/ng-rt-smart-contracts-explorer
* @type {Object}
*/

module.exports = {
  activate: (server, plugin, pluginInstance) => {
    // retrieve Plugin specific configuration
    const pluginSettings = server.plugin_manager.configs.get(plugin);

    // Retrieve namespace which is used in Scripting of the URL in routes below
    const namespace = pluginSettings.get('namespace');

    //     // Static route for HTML renderer
    server.use(`/${namespace}`, server.loopback.static(path.normalize(
      path.resolve(__dirname, '../../client/public'))));
  },
  deactivate: {}
};
