"use strict";

const path = require("path");
const logger = require("log4js").getLogger("route");

let plgn;

module.exports = {
  activate: (server, plugin, pluginInstance) => {
    plgn = pluginInstance.name;
    let services = server.plugin_manager.services;
    let i18n = services.get("i18n");

    const namespace = pluginInstance.config.get("namespace") || "ng-rt-admin";
    logger.trace(i18n.__("namespace =", namespace));

    server.use(
      server.loopback.static(
        path.resolve(__dirname, "../../from_core/static_root")
      )
    );

    server.use(
      "/admin",
      server.loopback.static(
        path.resolve(pluginInstance.path.absolute, "client", "public")
      )
    );

    server.use(
      "/custom",
      server.loopback.static(
        path.resolve(pluginInstance.path.absolute, "client", "custom")
      )
    );
    server.use(
      "/admin",
      server.loopback.static(
        path.resolve(pluginInstance.path.absolute, "../../../", "uploads")
      )
    );
    server.use(
      "/admin/",
      server.loopback.static(
        path.resolve(
          pluginInstance.path.absolute,
          "client",
          "bower_components/polymer-tinymce/tinymce/"
        )
      )
    );
    server.use(
      "/bower_components/fast-json-patch/src/",
      server.loopback.static(
        path.resolve(
          pluginInstance.path.absolute,
          "client/bower_components/fast-json-patch/src"
        )
      )
    );
    server.use(
      "/bower_components/jsoneditor/dist/img/",
      server.loopback.static(
        path.resolve(
          pluginInstance.path.absolute,
          "client/bower_components/jsoneditor/dist/img"
        )
      )
    );

    server.use(
      "/admin",
      server.loopback.static(
        path.resolve(
          pluginInstance.path.absolute,
          "../../../",
          "config/data/ng-rt-admin",
          "uploads"
        )
      )
    );

    server.use(
      "/admin/" + plgn + "/locales",
      server.loopback.static(
        path.resolve(pluginInstance.path.absolute, "api", "locales")
      )
    );
  },
  deactivate: {
    static: '/admin'
  }
};
