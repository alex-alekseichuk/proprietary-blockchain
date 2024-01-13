'use strict';

const commands = require('./commands/configure');
const configService = require('ng-configservice');
const logger = require('log4js').getLogger('test_commands_configure');
configService.read('config/server/config.json');
/*
commands.keys.generate(configService);
commands.aws.init(configService);
commands.log4js.create(configService);
commands.componentConfig.create(configService);
commands.datasources.create(configService);
commands.serverConfig.create(configService);
commands.prompt.get(configService);
*/
return testConfigure();
/**
 * @return {*} promise Returns a promise
 */
async function testConfigure() {
  try {
    let result;
    result = await commands.prompt.get({});
    logger.info('prompt :', result);

    result = await commands.prompt.get({silent: true});
    logger.info('prompt :', result);

    result = await commands.configConfig.create(configService, result);
    logger.info('configConfig :', result);

    result = await commands.aws.init(configService);
    logger.info('version :', result);

    result = await commands.keys.generate(configService);
    logger.info('version :', result);

    result = await commands.keys.generate(configService);
    logger.info('componentConfig :', result);

    result = await commands.log4js.create(configService);
    logger.info('log4js :', result);

    result = await commands.datasources.create(configService);
    logger.info('datasources :', result);

    result = await commands.serverConfig.create(configService);
    logger.info('serverConfig :', result);

    await configService.stopWatching();

    logger.info('DONE');
    return null;
  } catch (e) {
    logger.error('Error :', e);
    return Promise.reject(e);
  }
}
