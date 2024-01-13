/**
 * Action for installing npm modules
 */
'use strict';
const logger = require('log4js').getLogger('action.npm_install');
const actionName = "NPM_INSTALL";
const spawn = require('child_process').spawn;

module.exports = (actions, configService, i18n) => {
  actions[actionName] = {
    callback: action,
    mutateContainer: true
  };

  /**
   * install npm modules
   * @param {object} options parameters for npm install
   * @return {Promise} resolve on install completed
   */
  function npmInstall(options) {
    return new Promise((resolve, reject) => {
      let args = ['install'];
      if (options.name) {
        let pack = options.name.trim();
        if (options.version)
          pack += '@' + options.version.trim();
        args.push(pack);
      }
      // args.push('--no-package-lock');
      args.push('--production');
      let pr = spawn('npm', args, {cwd: options.path ? options.path : '.',
        maxBuffer: options.maxBuffer ? options.maxBuffer : 200 * 1024});

      pr.stdout.on('data', data => {
        if (typeof data != 'string')
          data = data.toString();
        logger.debug(data.trim());
      });

      pr.stderr.on('data', data => {
      });

      pr.on('close', code => {
        if (code)
          return reject(i18n.__('npm install failed'));
        logger.debug(i18n.__('npm install complete'));
        resolve();
      });
    });
  }

  /**
   * run action install npm modules
   * @param {object} pluginInstance instance of plugin
   * @param {object} parameters parameters for action
   * @param {object} server instance of applciation
   * @return {Promise} resolve on action completed
   */
  function action(pluginInstance, parameters, server) {
    return new Promise((resolve, reject) => {
      logger.debug(actionName, "action", "parameters:", parameters);
      const modules = [];
      if (parameters.packet_name)
        modules.push(parameters.packet_name);

      let npmPath = pluginInstance.path.absolute; // path.resolve(pluginPath, plugin);
      if (parameters.root) {
        npmPath = global.appBase;
      }

      const options = {
        forceInstall: false, // force install if set to true (even if already installed, it will do a reinstall) [default: false]
        npmLoad: { // npm.load(options, callback): this is the "options" given to npm.load()
          loglevel: 'silent',
          production: true,
          force: false, // [default: {loglevel: 'silent'}],
          packageLock: false
        },
        path: npmPath
      };
      if (parameters.package) {
        npmInstall(options).then(resolve).catch(reject);
      } else {
        if (parameters.packet_name) {
          options.name = parameters.packet_name;
          options.key = parameters.packet_name;
        }
        if (parameters.version)
          options.version = parameters.version;
        npmInstall(options).then(resolve).catch(reject);
      }
    });
  }
};
