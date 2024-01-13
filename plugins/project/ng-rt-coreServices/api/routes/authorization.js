'use strict';
const logger = require('log4js').getLogger('ng-rt-coreServices.routes.authorization');
module.exports = {
  activate: (server, plugin, pluginInstance) => {
    let service = require("../services/authorization")(server);
    server.get("/availabledomains", server.ensureLoggedUser(), (req, res) => {
      service.getUserDomains(req.user)
        .then(domains => {
          logger.debug(`Loaded ${domains.length} domains`);
          res.status(200).json(domains);
        }).catch(err => {
          logger.error(err);
          res.status(500).json(err);
        }).then(() => {
          res.end();
        });
    });
  },
  deactivate: {
    availabledomains: "/availabledomains"
  }
};
