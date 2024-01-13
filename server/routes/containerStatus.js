'use strict';
const logger = require('log4js').getLogger('routes/containerStatus');
const serviceManager = require('../services');

/**
 * API/Route/containerStatus
 *
 * @module API/Route/containerStatus
 * @type {Object}
 */

module.exports = server => {
  const configService = serviceManager.get('initialConfigService');

  const i18n = serviceManager.get('i18n');
  const namespace = configService.get('namespace') ? configService.get('namespace') : "ng-rt-core";
  // const isInit = server.plugin_manager.configs.get('ng-rt-dataDictionary').get('isInit')
  // logger.info('######## : ', isInit);

  /**
   *
   * @param {string} name Name of field
   * @param {object} req request object
   * @param {object} configValue value of containerStatus
   */
  function checkInBodyAndAdd(name, req, configValue) {
    if (req.body[name] !== undefined) {
      configValue[name] = req.body[name];
    }
  }

  const getContainerStatus = (req, res) => {
    logger.debug(i18n.__('getContainerStatus'));

    var result = {
      containerStatus: serviceManager.get('configService').get('containerStatus')
    };

    res.status(200).json(result).end();
  };

  const postContainerStatus = async(req, res) => {
    logger.debug(i18n.__('postContainerStatus'));

    let containerStatus = serviceManager.get('configService').get("containerStatus");

    checkInBodyAndAdd("immutable", req, containerStatus);
    checkInBodyAndAdd("state", req, containerStatus);
    checkInBodyAndAdd("pluginManagerUploadCLI", req, containerStatus);
    checkInBodyAndAdd("pluginManagerUploadUI", req, containerStatus);
    // "statusChanges": 0,
    containerStatus.timeStampOflastStateUpdate = new Date();

    let stateChanges = containerStatus.stateChanges || 0;
    stateChanges++;
    containerStatus.stateChanges = stateChanges;
    let result = await serviceManager.get('configService').add("containerStatus", containerStatus);

    res.status(200).send(result);
  };

  /**
   * Get the statuis of the container
   *
   * @name Get a list of assigned public Keys for a user
   * @route {GET} /${namespace}/containerStatus
   * @bodyparam {boolean} immutable Immutable container ( true || fasle )
   * @bodyparam {String} state State of the container ( locked || unlocked )
   * @bodyparam {boolean} pluginManagerUploadCLI Plugin upload via CLI allowed ( true || fasle )
   * @bodyparam {boolean} pluginManagerUploadUI Id Plugin upload via UI allowed ( true || fasle )
   * @authentication Requires valid role token
   * @returnparam {object} [status] 200 = OK  500 = Error
   */
  server.get(`/${namespace}/containerStatus`, server.ensureUserRoles(["sysadmin"]), getContainerStatus);

  /**
   * Updates the status of the container
   *
   * @name Updates the status of the container
   * @route {POST} /${namespace}/containerStatus
   * @authentication Requires valid role token
   * @returnparam {object} keys [status] 200 = OK  500 = Error
   */
  server.post(`/${namespace}/containerStatus`, server.validate(), server.ensureUserRoles(["sysadmin"]), postContainerStatus);
  // server.post(`/${namespace}/containerStatus`, postContainerStatus);
};