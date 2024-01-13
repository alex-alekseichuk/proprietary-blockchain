'use strict';
const actionName = "REMOVE_DATA";
const logger = require('log4js').getLogger('action.remove_data');
const hash = require("../../utils/hash");

module.exports = (actions, configService) => {
  actions[actionName] = action;

  /**
   * run action remove loopback data records
   * @param {object} pluginInstance instance of plugin
   * @param {object} parameters parameters for action
   * @param {object} server instance of applciation
   * @return {Promise} resolve on action completed
   */
  function action(pluginInstance, parameters, server) {
    return new Promise((resolve, reject) => {
      let modelName = parameters.model_name;
      let criteries = parameters.criteries;
      logger.trace("remove data", modelName, criteries);
      if (!server.models[modelName]) {
        logger.error("No model", modelName);
        return resolve();
      }
      if (modelName && criteries && criteries.length > 0) {
        let Model = server.models[modelName];
        Promise.all(criteries.map(cri => {
          if (configService.get("protectModifiedData") === true) {
            return new Promise((res, rej) => {
              Model.find({
                where: cri
              }, (err, finded) => {
                if (err) return reject(err);
                if (finded) {
                  Promise.all(finded.map(f => {
                    if (f._hash) {
                      let curHah = hash.getHash(f);
                      if (curHah !== f._hash) {
                        logger.trace("Protected by hash", f.id);
                        return Promise.resolve();
                      }
                    }
                    return Model.destroyAll({_id: f.getId()});
                  })).then(res, rej);
                }
              });
            });
          }
          return Model.destroyAll(cri);
        })).then(resolve, reject);
      } else
        reject("remove data error");
    });
  }
};
