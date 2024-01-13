"use strict";

const path = require("path");
const logger = require("log4js").getLogger("route");
const log4jsConfig = require(path.resolve(
  __dirname,
  "../../../../../config/server/log4js.json"
));

module.exports = {
  activate: (server, plugin, pluginInstance) => {
    let services = server.plugin_manager.services;
    let configService = services.get("configService");
    let i18n = services.get("i18n");

    const namespace = pluginInstance.config.get("namespace") || "ng-rt-admin";
    logger.trace(i18n.__("namespace =", namespace));

    server.get(`/${namespace}/toast`, server.ensureLoggedIn(), (req, res) => {
      logger.debug(i18n.__(`GET ${namespace}/toast`));
      return server.models.toast
        .find({
          where: {
            "user.username": req.user.username
          }
        })
        .then(toasts => {
          logger.trace("toasts =", toasts);
          res.json({
            success: true,
            toasts
          });
        })
        .catch(err => {
          res.status(500).json({
            success: false,
            error: err.message
          });
        });
    });

    server.post(`/${namespace}/toast`, server.ensureLoggedIn(), (req, res) => {
      logger.debug(`POST ${namespace}/toast`);
      logger.trace("req.user =", req.user);
      logger.trace("req.body =", req.body);
      let toast = {
        msg: req.body.msg,
        type: req.body.type,
        user: req.user,
        date: new Date()
      };
      return server.models.toast
        .create(toast)
        .then(() => {
          res.json({
            success: true,
            toast
          });
        })
        .catch(err => {
          res.status(500).json({
            success: false,
            error: err.message
          });
        });
    });

    /**
     * Get route
     *
     * @name Get route
     * @route {GET} /${namespace}/routes
     * @authentication Requires an valid Session Token
     */
    server.get(`/${namespace}/routes`, server.ensureLoggedIn(), (req, res) => {
      const qStr = {
        where: {
          id: req.query.routeId
        }
      };
      server.models.route
        .findOne(qStr)
        .then(result => res.json(result))
        .catch(err => {
          logger.error("error:", err);
          res.json({
            success: false
          });
        });
    });

    /**
     * Get contact groups
     *
     * @name Get contact groups
     * @route {GET} /${namespace}/contactGroups
     * @authentication Requires an valid Session Token
     */
    server.get(
      `/${namespace}/contactGroups`,
      server.ensureLoggedIn(),
      (req, res) => {
        server.models.contactGroup
          .find()
          .then(result => res.json(result))
          .catch(err => {
            logger.error("error:", err);
            res.json({
              success: false
            });
          });
      }
    );

    /**
     * Put contact groups
     *
     * @name put groups
     * @route {PUT} /${namespace}/contactGroups
     * @authentication Requires an valid Session Token
     */
    server.put(
      `/${namespace}/contactGroups`,
      server.ensureLoggedIn(),
      (req, res) => {
        server.models.contactGroup
          .upsert({
            name: req.body.name,
            contacts: req.body.contacts,
            id: req.body.id
          })
          .then(result => {
            res.json({
              success: true,
              result
            });
          })
          .catch(err => {
            logger.error("error:", err);
            res.json({
              success: false
            });
          });
      }
    );

        /**
     * Retrieve Self registration
     *
     * @name  Retrieve System settings self-registration
     * @route {GET} /${namespace}/system_settings_selfregistration
     * @bodyparam {Boolean} selfRegistrationEnabled

     */
    server.get(`/${namespace}/system_settings_selfregistration`, (req, res) => {
      logger.debug(i18n.__("executing GET /system_settings_selfregistration"));

      res.send({
        selfRegistrationEnabled: configService.get("disableSelfRegistration")
      });
    });

    /**
     * Delete skill
     *
     * @name Delete skill
     * @route {DELETE} /${namespace}/skill
     * @authentication Requires valid session token
     * @returnparam {object} [status] 200 = OK  500 = Error
     */
    server.delete(
      `/${namespace}/skill`,
      server.ensureLoggedIn(),
      (req, res) => {
        server.models.skill
          .delete(req.body.skillId)
          .then(key => {
            res.status(200).json(key);
          })
          .catch(err => {
            logger.error(err);
            res.status(500).json(err);
          })
          .then(() => {
            res.end();
          });
      }
    );

    /**
     * Get skills by userID
     *
     * @name Get skills by userID
     * @route {POST} /${namespace}/skillsByUserId
     * @authentication Requires valid session token
     * @returnparam {object} [status] 200 = OK  500 = Error
     */
    server.post(
      `/${namespace}/skillsByUserId`,
      server.ensureLoggedIn(),
      (req, res) => {
        const qStr = {
          where: {
            userId: req.body.userId
          }
        };
        server.models.skill
          .find(qStr)
          .then(result => res.json(result))
          .catch(err => {
            logger.error("error:", err);
            res.json({
              success: false
            });
          });
      }
    );

    /**
     * Get skills levels
     *
     * @name Get skills levels
     * @route {GET} /${namespace}/skillLevels
     * @authentication Requires an valid Session Token
     */
    server.get(
      `/${namespace}/skillLevels`,
      server.ensureLoggedIn(),
      (req, res) => {
        server.models.skillLevel
          .find()
          .then(result => res.json(result))
          .catch(err => {
            logger.error("error:", err);
            res.json({
              success: false
            });
          });
      }
    );

    /**
     * Get skills types
     *
     * @name skills types
     * @route {GET} /${namespace}/skillTypes
     * @authentication Requires an valid Session Token
     */
    server.get(
      `/${namespace}/skillTypes`,
      server.ensureLoggedIn(),
      (req, res) => {
        server.models.skillType
          .find()
          .then(result => res.json(result))
          .catch(err => {
            logger.error("error:", err);
            res.json({
              success: false
            });
          });
      }
    );

    /**
     * Put skills
     *
     * @name put skills
     * @route {PUT} /${namespace}/skillTypes
     * @authentication Requires an valid Session Token
     */
    server.put(`/${namespace}/skills`, server.ensureLoggedIn(), (req, res) => {
      server.models.skill
        .upsert({
          id: req.body.id,
          userId: req.body.userId,
          skillTypeId: req.body.skillTypeId,
          skillLevelId: req.body.skillLevelId
        })
        .then(result => res.json(result))
        .catch(err => {
          logger.error("error:", err);
          res.json({
            success: false
          });
        });
    });

    /**
     * Get smart contract definitions
     *
     * @name Get smart contract definitions
     * @route {POST} /${namespace}/smartContractDefinitions
     * @authentication Requires an valid Session Token
     */
    server.post(
      `/${namespace}/smartContractDefinitions`,
      server.ensureLoggedIn(),
      (req, res) => {
        const qStr = {
          where: {
            transaction: req.body.transaction
          }
        };
        server.models.smartContractDefinition
          .findOne(qStr)
          .then(result => res.json(result))
          .catch(err => {
            logger.error("error:", err);
            res.json({
              success: false
            });
          });
      }
    );

    /**
     * Put myDetails
     *
     * @name put myDetails
     * @route {PUT} /${namespace}/myDetails
     * @authentication Requires an valid Session Token
     */
    server.put(
      `/${namespace}/myDetails`,
      server.ensureLoggedIn(),
      (req, res) => {
        server.models.myDetails
          .upsert({
            userId: req.body.userId,
            mainDisruptiveTechnologyId: req.body.mainDisruptiveTechnologyId,
            mainDisruptiveSpecialismId: req.body.mainDisruptiveSpecialismId,
            base: req.body.base,
            tribe: req.body.tribe
          })
          .then(result => res.json(result))
          .catch(err => {
            logger.error("error:", err);
            res.json({
              success: false
            });
          });
      }
    );

    /**
     * Delete user
     *
     * @name Delete user
     * @route {DELETE} /${namespace}/myDetails
     * @authentication Requires valid session token
     * @returnparam {object} [status] 200 = OK  500 = Error
     */
    server.delete(
      `/${namespace}/myDetails`,
      server.ensureLoggedIn(),
      (req, res) => {
        server.models.myDetails.myDetails
          .delete(req.body.userId)
          .then(key => {
            res.status(200).json(key);
          })
          .catch(err => {
            logger.error(err);
            res.status(500).json(err);
          })
          .then(() => {
            res.end();
          });
      }
    );

    /**
     * Get a list of all Roles
     *
     * @name Get a list of Roles
     * @route {GET} /${namespace}/roles
     * @authentication Requires an valid Session Token
     * @bodyparam {Array} roles List of Roles
     */
    server.get(`/${namespace}/roles`, server.ensureLoggedIn(), (req, res) => {
      logger.debug("GET /ng-rt-admin/roles");
      res.json({
        success: true,
        roles: req.user.roles
      });
    });

    /**
     * Get public part of plugin specific config
     *
     * @name Get public part of plugin specific config
     * @route {GET} /${namespace}/config
     * @authentication Requires an valid Session Token
     * @bodyparam {Object} config public part of config
     */
    server.get(
      `/${namespace}/settings`,
      server.ensureLoggedIn(),
      (req, res) => {
        logger.debug("GET /ng-rt-admin/settings");
        res.json({
          success: true,
          settings: {
            profileEditors: pluginInstance.config.get("profileEditors"),
            requireTerms: pluginInstance.config.get("requireTerms"),
            keysStrategy: pluginInstance.config.get("keysStrategy"),
            redirectFromHomeRules: pluginInstance.config.get(
              "redirectFromHomeRules"
            )
          }
        });
      }
    );

    /**
     * Get required attribute for full name
     *
     * @name Get required attribute for full name
     * @route {GET} /${namespace}/settings/requirefullname
     * @bodyparam {Boolean} flag for required
     */
    server.get(`/${namespace}/settings/requirefullname`, (req, res) => {
      logger.debug("GET /ng-rt-admin/settings/requirefullname");
      res.json({
        success: true,
        settings: {
          requireFullname: pluginInstance.config.get("requireFullname")
        }
      });
    });

    /**
     * Get the User profile information
     *
     * @name Get the User profile information
     * @route {GET} /${namespace}/user
     * @authentication Requires an valid Session Token
     * @bodyparam {String} user.id Id of the User
     */
    server.get(`/${namespace}/user`, server.ensureLoggedIn(), (req, res) => {
      logger.debug("GET /ng-rt-admin/user");
      server.models.User.findOne({
        where: {
          id: req.user.id
        }
      })
        .then(user => {
          res.json({
            success: true,
            user
          });
        })
        .catch(err => {
          logger.error(
            "GET ng-rt-components-backend/contacts error =",
            err.message
          );
          res.json({
            success: false,
            error: err.message
          });
        });
      logger.debug("GET /ng-rt-admin/user WAIT...");
    });

    /**
     * Get a list of all skills
     *
     * @name Get a list of all skills
     * @route {GET} /${namespace}/skills
     * @authentication Requires an valid Session Token
     * @bodyparam {String} skills List of all skills
     */
    server.get(`/${namespace}/skills`, server.ensureLoggedIn(), (req, res) => {
      logger.debug("GET /ng-rt-admin/skills");
      server.models.skill
        .find({})
        .then(skills => {
          res.json({
            success: true,
            skills
          });
        })
        .catch(err => {
          logger.error("GET /ng-rt-admin/skills error =", err.message);
          res.json({
            success: false,
            error: err.message
          });
        });
      logger.debug("GET /ng-rt-admin/skills");
    });

    /**
     * Get applications
     *
     * @name Get applications
     * @route {POST} /${namespace}/getApplications
     * @authentication Requires an valid Session Token
     */
    server.post(
      `/${namespace}/getApplications`,
      server.ensureLoggedIn(),
      (req, res) => {
        const qStr = req.body;
        server.models.plugin
          .find(qStr)
          .then(result => res.json(result))
          .catch(err => {
            logger.error("error:", err);
            res.json({
              success: false
            });
          });
      }
    );

    server.get("/admin/img/:dir/:fileName", (req, res, next) => {
      logger.trace(
        "getting image, dir =",
        req.params.dir,
        "fileName =",
        req.params.fileName
      );
      logger.trace("typeof dir =", typeof req.params.dir);
      logger.trace("typeof fileName =", typeof req.params.fileName);
      // server.models.img.findOne({where: {and: [{dir: req.params.dir}, {fileName: req.params.fileName}]}})
      // server.models.img.find({where: {dir: String(req.params.dir), fileName: '59365481c075d2425907e99d'}})
      // server.models.img.find({where: {fileName: '59365481c075d2425907e99d'}})
      server.models.img
        .find({
          where: {
            dir: req.params.dir,
            fileName: req.params.fileName
          }
        })
        .then(imgs => {
          logger.trace("imgs.length =", imgs.length);
          let img = imgs[0];
          if (!img) return logger.trace("img not found!") ^ next();
          logger.trace(
            "found img.dir =",
            img.dir,
            "img.fileName =",
            img.fileName
          );
          let b = new Buffer(img.data, "hex");
          res.send(b);
        })
        .catch(err => {
          res.status(500).json({
            success: false,
            error: err.message
          });
        });
    });

    /**
     * Get some system configuration
     *
     * @name Get some system configuration
     *
     * @route {GET} /${namespace}/config
     * @authentication None
     * @bodyparam {String} maxFileSize Maximum Filezie for uploads
     * @bodyparam {servers} servers List of servers
     * @bodyparam {storages} List of storages
     */
    server.get(`/${namespace}/config`, (req, res) => {
      if (req.body.plugin) {
        logger.debug("Plugin :", req.body.plugin);
      }

      res.send({
        maxFileSize: configService.get("maxFileSize"),
        servers: configService.get("servers"),
        storages: configService.get("storages"),
        keysStrategy: pluginInstance.config.get("keysStrategy"),
        log4js: log4jsConfig.client || {}
      });
    });

    // to support initial page in state machine
    server.get("/empty.html", (req, res) => {
      res.sendFile(
        path.resolve(
          pluginInstance.path.absolute.replace('ng-rt-admin-backend', 'ng-rt-admin'),
          "client/public/empty_layout.html"
        )
      );
    });

    server.get("/attach-sc.html", (req, res) => {
      res.sendFile(
        path.resolve(
          pluginInstance.path.absolute.replace('ng-rt-admin-backend', 'ng-rt-admin'),
          "client/public/ng-rt-attach-sc.html"
        )
      );
    });

    /**
     * Get details for User
     *
     * @name details for User
     * @route {POST} /${namespace}/myDetailsByUserId
     * @authentication Requires an valid Session Token
     */
    server.post(`/${namespace}/myDetailsByUserId`, server.ensureLoggedIn(), (req, res) => {
      const qStr = {
        where: {
          userId: req.body.userId
        }
      };
      server.models.myDetails.find(qStr)
        .then(result => res.json(result))
        .catch(err => {
          logger.error('error:', err);
          res.json({
            success: false
          });
        });
    });

    /**
     * Get all myDetails
     *
     * @name myDetails
     * @route {GET} /${namespace}/myDetails
     * @authentication Requires an valid Session Token
     */
    server.get(`/${namespace}/myDetails`, server.ensureLoggedIn(), (req, res) => {
      server.models.myDetails.find()
        .then(result => res.json(result))
        .catch(err => {
          logger.error('error:', err);
          res.json({
            success: false
          });
        });
    });

    let settings = pluginInstance.config;
    logger.debug(i18n.__("ng-rt-admin settings"), settings);
    let redurl = settings.get("redurl");
    let rethinkurl = settings.get("rethinkurl");
    let portainerurl = settings.get("portainerurl");
    let rabbitmqurl = settings.get("rabbitmqurl");
    let bigchaindb = settings.get("bigchaindb");
    let monitoringdashboardurl = settings.get("monitoringdashboardurl");
    let internalDNSName = configService.get("internalDNSName");
    logger.debug(i18n.__("internalDNSName"), ":", internalDNSName);

    /**
     *
     * @param {*} str String
     * @return {String} replaced string
     */
    function checkAndReplaceIntrnalDNSName(str) {
      return str.replace("${internalDNSName}", internalDNSName);
    }

    if (redurl) {
      redurl = checkAndReplaceIntrnalDNSName(redurl);
      logger.debug(i18n.__("redurl"), ":", redurl);

      server.models.route.create({
        type: "href",
        href: redurl,
        target: "_blank",
        icon: "icons:settings-input-composite",
        caption: "Node Red",
        roles: ["admin"],
        module: "admin",
        order: 6030
      });
    }
    if (bigchaindb) {
      bigchaindb = checkAndReplaceIntrnalDNSName(bigchaindb);
      server.models.route.create({
        type: "href",
        href: bigchaindb,
        target: "_blank",
        icon: "icons:settings-input-composite",
        caption: "BigchainDB Instance",
        roles: ["admin"],
        module: "admin",
        order: 6050
      });
    }
    if (rethinkurl) {
      rethinkurl = checkAndReplaceIntrnalDNSName(rethinkurl);
      server.models.route.create({
        type: "href",
        href: rethinkurl,
        target: "_blank",
        icon: "build",
        caption: "RethinkDB Admin",
        roles: ["admin"],
        module: "admin",
        order: 6040
      });
    }

    if (portainerurl) {
      portainerurl = checkAndReplaceIntrnalDNSName(portainerurl);
      server.models.route.create({
        type: "href",
        href: portainerurl,
        target: "_blank",
        icon: "build",
        caption: "Docker Container Admin",
        roles: ["sysadmin"],
        module: "admin",
        order: 6050
      });
    }

    if (rabbitmqurl) {
      rabbitmqurl = checkAndReplaceIntrnalDNSName(rabbitmqurl);
      server.models.route.create({
        type: "href",
        href: rabbitmqurl,
        target: "_blank",
        icon: "build",
        caption: "Rabbit MQ Admin",
        roles: ["admin"],
        module: "admin",
        order: 6051
      });
    }

    if (monitoringdashboardurl) {
      monitoringdashboardurl = checkAndReplaceIntrnalDNSName(monitoringdashboardurl);
      server.models.route.create({
        type: "href",
        href: monitoringdashboardurl,
        target: "_blank",
        icon: "icons:timeline",
        caption: "Statistic Dashboard",
        roles: ["admin"],
        module: "admin",
        order: 6060
      });
    }
  }
};
