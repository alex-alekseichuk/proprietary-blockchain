'use strict';
const actionName = "ADD_DATA";
const logger = require('log4js').getLogger('action.add_data');
const _ = require('lodash');
const path = require("path");
const fs = require('fs');
const hash = require("../../utils/hash");

module.exports = (actions, configService) => {
  actions[actionName] = (pluginInstance, parameters, server) => {
    return new Promise((resolve, reject) => {
      var data = null;
      if (parameters.file) {
        if (path.isAbsolute(parameters.file[0]))
          parameters.file = "." + parameters.file;
        data = JSON.parse(fs.readFileSync(path.resolve(pluginInstance.path.absolute, parameters.file), 'utf8'));
      } else {
        data = parameters.data;
      }

      // update values of first data item by parameters from the config
      if (parameters.config) {
        var options = configService.get(parameters.config.path);
        if (options)
          _.extend(data[0], options);
      }

      let modelName = parameters.model_name;

      logger.trace('add_data', modelName, data);
      if (!server.models[modelName]) {
        logger.error("No model", modelName);
        return resolve();
      }
      if (modelName && data && data.length > 0) {
        let Model = server.models[modelName];
        Promise.all(data.map(async rec => {
          if (parameters.primaryKeys) {
            let criteria = {};
            let keys = parameters.primaryKeys.split(',');
            keys.forEach(key => {
              criteria[key] = rec[key];
            });
            let dsr = await Model.findOne({where: criteria});
            if (dsr) {
              return Promise.resolve();
            }
            return Model.create(rec);
          }
          return Model.create(rec);
        })).then(recs => {
          logger.trace('add_data resolved');
          if (recs) {
            if (parameters.addHash) {
              recs.forEach(rec => {
                Model.updateAll({_id: rec.id}, {_hash: hash.getHash(rec)}, err => {
                  if (err) logger.error(err);
                });
              });
            }
          }
          resolve();
        }).catch(err => {
          logger.error('add_data error', err);
          reject(err);
        });
      } else {
        logger.debug('action add data error');
        reject("action add data error");
      }
    });
  };
};
