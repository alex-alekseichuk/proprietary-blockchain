'use strict';
const logger = require('log4js').getLogger('plugins_manger/applicationRepo.js');

/**
 * plugins loopback model manager
 * @param {object} Application plugin loopback model instance
 * @return {object} instance of plugins loopback model manager
 */
function ApplicationRepo(Application) {
  // Application.dataSource.autoupdate(() => {
  //   Application.dataSource.ds.discoverModelProperties('plugin', (err, props) => {
  //     if (err) {
  //       logger.error('Automigrate failed')
  //       return logger.error(err);
  //     }
  //     logger.debug('migrated', props);
  //   });
  // });

  /**
   * create plugin record
   * @param {string} plugin plugin name
   * @param {string} version plugin current version
   * @param {string} type plugin type (mandatory, optional)
   * @param {string} htmlHelpFile path to help file
   * @param {string} source plugin source
   * @param {string} storage plugins storage name
   * @param {boolean} useAsApp true if plugin can be used as application
   * @param {boolean} useAsSubscription true if can be used as subscription
   * @param {number} order order of plugin
   * @return {Promise} resolve on created
   */
  function create(plugin, version, type, htmlHelpFile, source, storage, useAsApp, useAsSubscription, order) {
    return Application.create({
      name: plugin,
      type: type,
      htmlHelpFile: htmlHelpFile,
      version: version,
      installed: new Date(),
      active: false,
      source: source,
      storage: storage,
      asApp: useAsApp,
      asSubscription: useAsSubscription,
      order: order
    });
  }

  /**
   * Update plugin
   * @param {string} plugin plugin name
   * @param {string} version plugin current version
   * @param {string} type plugin type (mandatory, optional)
   * @param {string} htmlHelpFile path to help file
   * @param {string} source plugin source
   * @param {string} storage plugins storage name
   * @param {boolean} useAsApp true if plugin can be used as application
   * @param {boolean} useAsSubscription true if can be used as subscription
   * @return {Promise} resolve on updated
   */
  function update(plugin, version, type, htmlHelpFile, source, storage, useAsApp, useAsSubscription) {
    return Application.updateAll({name: plugin},
      {
        type: type,
        htmlHelpFile: htmlHelpFile,
        version: version,
        installed: new Date(),
        source: source,
        storage: storage,
        asApp: useAsApp,
        asSubscription: useAsSubscription
      });
  }

  /**
   * find plugin record
   * @param {string} plugin plugin name
   * @return {Promise} resolve plugin records
   */
  function findOne(plugin) {
    return new Promise((resolve, reject) => {
      return Application.findOne({where: {name: plugin}}).then(resolve).catch(reject);
    });
  }

  /**
   * set plugin activation
   * @param {string} plugin plugin name
   * @param {boolean} unactivated true if plugin not activated
   * @return {Promise} resolve result
   */
  function setActivation(plugin, unactivated) {
    return Application.updateAll({name: plugin}, {active: !unactivated});
  }

  /**
   * find plugin records
   * @param {objcet} where query filter
   * @param {number} order ordering type
   * @param {number} limit reecords limit
   * @return {Promise} resolve list of plugins records
   */
  function find(where, order, limit) {
    let query = {};
    if (where)
      query.where = where;
    if (order)
      query.order = order;
    if (limit)
      query.limit = limit;
    return Application.find(query);
  }

  /**
   * remove plugin record
   * @param {string} plugin plugin name
   * @return {Promise} resolve result
   */
  function remove(plugin) {
    return Application.destroyAll({name: plugin});
  }

  /**
   * set plugin license state
   * @param {string} plugin plugin name
   * @param {string} state state of license check
   * @return {Promise} resolve result
   */
  function setLicenseState(plugin, state) {
    return Application.updateAll({name: plugin}, {licenseState: state});
  }

  /**
   * set all plugins not activated
   * @return {Promise} resolve result
   */
  function resetActivated() {
    return Application.updateAll({}, {activated: false});
  }

  /**
   * set plugin activated
   * @param {string} plugin plugin name
   * @param {boolean} activated true if plugin activated
   * @return {Promise} reesolve result
   */
  async function setActivated(plugin, activated) {
    var setter = {activated: activated};
    if (activated)
      setter.activatedDate = new Date();
    return Application.updateAll({name: plugin}, setter);
  }

  /**
   * clear error messages
   * @param {string} plugin plugin name
   * @param {string} property name of errors messages type
   * @return {Promise} resolve result
   */
  async function clearMessages(plugin, property) {
    let item = await findOne(plugin);
    if (!item || !item[property] || item[property].length < 1)
      return Promise.resolve();
    let clObj = {};
    clObj[property] = null;
    return item.updateAttributes(clObj);
  }

  /**
   * clear activate error messages
   * @param {string} plugin plugin name
   * @return {Promise} resolve result
   */
  function clearActivateMessages(plugin) {
    return clearMessages(plugin, "activateMessages");
  }

   /**
   * clear deactivation error messages
   * @param {string} plugin plugin name
   * @return {Promise} resolve result
   */
  function clearDeacticvateMessages(plugin) {
    return clearMessages(plugin, "deactivateMessages");
  }

   /**
   * clear install eerror messages
   * @param {string} plugin plugin name
   * @return {Promise} resolve result
   */
  function clearInstallMessages(plugin) {
    return clearMessages(plugin, "installMessages");
  }

   /**
   * clear uninstall error messages
   * @param {string} plugin plugin name
   * @return {Promise} resolve result
   */
  function clearUninstallMessages(plugin) {
    return clearMessages(plugin, "uninstallMessages");
  }

   /**
   * clear smoke tests error messages
   * @param {string} plugin plugin name
   * @return {Promise} resolve result
   */
  function clearSmokeTestMessages(plugin) {
    return clearMessages(plugin, "smokeTestMessages");
  }

  /**
   * add error meessage
   * @param {string} plugin plugin name
   * @param {string} property error message type
   * @param {string} message error message text
   * @return {Promise} resolve result
   */
  async function addMessage(plugin, property, message) {
    // return Promise.resolve();
    let item = await findOne(plugin);
    if (!item)
      return Promise.resolve();
    let pushObj = [];
    if (item[property])
      pushObj = item[property];
    pushObj.push(message);
    let update = {};
    update[property] = pushObj;
    return item.updateAttributes(update);
  }

  /**
   * add actionvation error message
   * @param {string} plugin plugin name
   * @param {string} message error message text
   * @return {Promise} resolve result
   */
  function addActivateMessage(plugin, message) {
    return addMessage(plugin, "activateMessages", message);
  }

  /**
   * add deactionvation error message
   * @param {string} plugin plugin name
   * @param {string} message error message text
   * @return {Promise} resolve result
   */
  function addDeactivateMessage(plugin, message) {
    return addMessage(plugin, "deactivateMessage", message);
  }
  /**
   * add install error message
   * @param {string} plugin plugin name
   * @param {string} message error message text
   * @return {Promise} resolve result
   */
  function addInstallMessage(plugin, message) {
    return addMessage(plugin, "installMessages", message);
  }
  /**
   * add uninstall error message
   * @param {string} plugin plugin name
   * @param {string} message error message text
   * @return {Promise} resolve result
   */
  function addUninstallMessage(plugin, message) {
    return addMessage(plugin, "uninstallMessages", message);
  }
  /**
   * add smoke test error message
   * @param {string} plugin plugin name
   * @param {string} message error message text
   * @return {Promise} resolve result
   */
  function addSmokeTestMessage(plugin, message) {
    return addMessage(plugin, "smokeTestMessages", message);
  }

  /**
   * set plugin as application
   * @param {string} plugin plugin name
   * @param {boolean} asApp true if plugin can be used as application
   * @return {Promise} resolve result
   */
  function setAsApp(plugin, asApp) {
    return Application.updateAll({name: plugin}, {asApp: asApp});
  }

  /**
   * set plugin assubscription
   * @param {string} plugin plugin namee
   * @param {boolean} asSubscription true if as subscription
   * @return {Promise} resolve result
   */
  function setAsSubscription(plugin, asSubscription) {
    return Application.updateAll({name: plugin}, {asSubscription: asSubscription});
  }

  /**
   * get next orfer for plugin
   * @return {Promise} resolve next order
   */
  function getNextOrder() {
    return new Promise((resolve, reject) => {
      Application.find({fields: {order: true}, order: "order DESC", limit: 1}).then(result => {
        logger.debug("get order:", result);
        if (!result || result.length < 1 || result[0].order == undefined)
          return resolve(0);
        return resolve(result[0].order + 1);
      }).catch(reject);
    });
  }
  // function update(plugin) {
  //   return Application.update();
  // }
  return {
    create: create,
    update: update,
    findOne: findOne,
    setActivation: setActivation,
    find: find,
    remove: remove,
    setLicenseState: setLicenseState,
    resetActivated: resetActivated,
    setActivated: setActivated,
    messages: {
      activate: {
        add: addActivateMessage,
        clear: clearActivateMessages
      },
      deactivate: {
        add: addDeactivateMessage,
        clear: clearDeacticvateMessages
      },
      install: {
        add: addInstallMessage,
        clear: clearInstallMessages
      },
      uninstall: {
        add: addUninstallMessage,
        clear: clearUninstallMessages
      },
      smoke: {
        add: addSmokeTestMessage,
        clear: clearSmokeTestMessages
      }
    },
    setAsApp: setAsApp,
    setAsSubscription: setAsSubscription,
    getNextOrder: getNextOrder
  };
}

module.exports = ApplicationRepo;
