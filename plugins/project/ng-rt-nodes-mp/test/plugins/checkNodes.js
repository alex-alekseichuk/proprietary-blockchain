"use strict";

module.exports = (pluginInstance, options, services) => {
  return new Promise((resolve, reject) => {
    // return resolve();
    const redService = services.get('RED');
    let pack = require('../../package.json');
    if (!pack)
      return resolve();
    let moduleInfo = redService.RED.nodes.getModuleInfo(pack.name);
    if (!moduleInfo)
      reject(services.get('i18n').__('Module not found'));
    let errors = [];
    moduleInfo.nodes.forEach(m => {
      if (m.err)
        errors.push(m.err + '\r\n');
    });
    if (errors.length > 0)
      return reject(errors);
    resolve();
  });
};
