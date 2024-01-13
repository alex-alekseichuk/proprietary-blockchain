'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('commands.init');
const commands = require('../../cli/commands/initialize');
const confCommands = require('./configure/index');
const LoopbackConfigService = require('../../server/backend/LoopbackConfigService');

const runCommand = async (argv, argumentName, comm, configService, stepName, index, maxSteps) => {
  if (!argv.all && !argv[argumentName])
    return;
  await comm(configService);
  logger.info(`Step ${index}/${maxSteps} done: ${stepName}`);
};

/**
 * Creates all required files for starting the server
 * @param {object}  argv - The object instance of the type ARGV
 * @param {object}  result - The object instance of the result
 * @param {object}  i18n - The object instance of i18n
 */
async function command(argv, result, i18n) {
  try {
    logger.debug(i18n.__('9999: Next generation Runtime init is being executed'));

    const maxSteps = 9;
    let i = 1;
    argv.all = Boolean(process.argv.length === 3 || (process.argv.length === 4 && argv.silent) || argv.all);
    const fileConfigService = require('ng-configservice');
    fileConfigService.read('config/server/config.json');
    let configService = fileConfigService;

    await confCommands.datasources.create(configService);
    configService = new LoopbackConfigService(i18n, fileConfigService);
    await configService.init();

    if (!argv.silent) {
      await commands.confirmDialog.delete(configService);
      logger.info(i18n.__('0145 : Step %s/%s done: deleteConfirmDialog', i++, maxSteps));
    }
    await runCommand(argv, 'datasources', commands.dataSource.drop, configService, 'deleteDataSources', i++, maxSteps);
    await runCommand(argv, 'nodeModules', commands.nodeModules.delete, configService, 'deleteNodeModules', i++, maxSteps);
    await runCommand(argv, 'logs', commands.log.delete, configService, 'deleteLogs', i++, maxSteps);
    await runCommand(argv, 'flows', commands.nodeRedFlows.delete, configService, 'deleteNodeRedFlows', i++, maxSteps);
    await runCommand(argv, 'plugins', commands.plugins.delete, configService, 'deletePlugin', i++, maxSteps);
    await runCommand(argv, 'customPlugins', commands.customPlugins.delete, configService, 'deleteCustomPlugins', i++, maxSteps);
    await runCommand(argv, 'configFile', commands.configFile.delete, configService, 'deleteConfigFile', i++, maxSteps);
    await runCommand(argv, 'configDb', commands.configDb.delete, configService, 'deleteConfigDb', i++, maxSteps);
    logger.info(i18n.__('0153 : All parts of --init executed'));
    process.exit(0);
  } catch (err) {
    logger.error(err);
  }
}

module.exports = command;
