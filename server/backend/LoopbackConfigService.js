"use strict";
const logger = require('log4js').getLogger('loopbackConfigService');
const EventEmitter = require('events').EventEmitter;

const getValueFieldName = type => {
  switch (type) {
    case 'object':
      return 'valueObject';
    case 'string':
      return 'valueString';
    case 'date':
      return 'valueDate';
    case 'number':
      return 'valueNumber';
    case 'boolean':
      return 'valueBoolean';
    case 'array':
      return 'valueArray';
    default:
      throw new Error("Config service doessn't support value type", type);
  }
};

const getType = value => {
  let result = typeof value;
  if (result === 'object' && Array.isArray(value))
    result = 'array';
  return result;
}

const getDeepObjectFieldValue = (fields, value) => {
  if (typeof value === 'undefined')
    return;
  if (fields.length === 0)
    return value;
  let field = fields.shift();
  return getDeepObjectFieldValue(fields, value[field]);
};

const setDeepObjectFieldValue = (fields, oldValue, value) => {
  if (!value && value !== false)
    return;
  if (fields.length === 0)
    return value;
  let field = fields.shift();
  let ret = {};
  if (oldValue)
    ret = {...oldValue };
  ret[field] = setDeepObjectFieldValue(fields, typeof oldValue === 'object' ? oldValue[field] : oldValue, value);
  return ret;
};

const getDeepObjectField = field => {
  let delimeter = field.indexOf('.') > -1 ? '.' : (field.indexOf(':') > -1 ? ':' : null);
  if (!delimeter)
    return;
  let fields = field.split(delimeter);
  return fields;
};

let newLockerFactory = queue => {
  let _resolver = null;
  let _promise = new Promise(resolve => {
    _resolver = resolve;
  });
  return {
    resolve: r => {
      if (_resolver && typeof _resolver === 'function')
        _resolver();
    },
    get promise() {
      return _promise;
    }
  };
};

module.exports = class LoopbackConfigService {
  constructor(i18n, configService, app, plugin) {
    this._i18n = i18n;
    this._configService = configService.fileConfigService || configService;
    this._app = app;
    this._plugin = plugin;
    this._lockerQueue = [];
  }

  async lock() {
    let locker = newLockerFactory(this._lockerQueue);
    this._lockerQueue.push(locker);
    if (this._lockerQueue.length > 1) {
      const currentLocker = this._lockerQueue.shift();
      await currentLocker.promise;
    }
    return Promise.resolve(locker);
  }

  unlock(locker) {
    const index = this._lockerQueue.indexOf(locker);
    if (index > -1)
      this._lockerQueue.splice(index, 1);
    locker.resolve();
  }

  pluginCheck(rec) {
    if (this._plugin && rec)
      rec.plugin = this._plugin;
    else
      rec.plugin = '-';
    return rec;
  }

  async init() {
    if (!this._app) {
      this._app = await require('../loopbackApp')(true);
      let ds = this._app.models.config.getDataSource();
      await ds.autoupdate('config');
    }

    this._emitter = new EventEmitter();

    this._configModel = this._app.models.config;

    this._instance = {};

    if (!this._plugin)
      this._app.configInstance = this._instance;

    let configs = await this._configModel.find({ where: this.pluginCheck({}) });
    if (configs && configs.length > 0)
      configs.forEach(element => {
        this._instance[element.name] = this.getValue(element);
      });
    this.fileConfigService = this._configService;
  }

  getValue(record) {
    let fieldName = getValueFieldName(record.type);
    return record[fieldName];
  }

  async getFromDb(field) {
    let result = await this._configModel.findOne({ where: this.pluginCheck({ name: field }) });
    if (result) {
      return this.getValue(result);
    }
    return;
  }

  async addToDb(field, value, assignValues) {
    try {
      logger.trace('addToDb', field, '=', value);
      if (value === undefined)
        return false;
      let type = getType(value);
      logger.trace(this._i18n.__('add'), this._i18n.__('field'), field, this._i18n.__('value'), value, this._i18n.__('type'), type);
      let rec = {
        name: field,
        type: type
      };
      let fieldName = getValueFieldName(type);
      rec[fieldName] = value;
      let find = await this.getFromDb(field);
      logger.trace('find', find);
      if (find === undefined) {
        await this._configModel.create(this.pluginCheck(rec));
        logger.trace('inserted');
        return;
      }
      let query = this.pluginCheck({ name: field });
      if (assignValues)
        rec[fieldName] = Object.assign(find, rec[fieldName]);
      await this._configModel.updateAll(query, this.pluginCheck(rec));
      logger.trace('updated');
      return Promise.resolve();
    } catch (e) {
      logger.error(e);
      return Promise.reject(e);
    }
  }

  async add(field, value, hidden) {
    if (value === undefined)
      return false;
    let locker = await this.lock();
    try {
      let fields = getDeepObjectField(field);
      if (fields && fields.length > 1) {
        let rootField = fields.shift();
        value = setDeepObjectFieldValue(fields, this._instance[rootField], value);
        if (value === undefined)
          return false;
        await this.addToDb(rootField, value, true);
        this._instance[rootField] = value;
      } else {
        await this.addToDb(field, value);
        this._instance[field] = value;
      }
    } finally {
      this.unlock(locker);
    }
    if (!hidden)
      this._emitter.emit('add', this.pluginCheck({ field: field, value: value }));
    return true;
  }

  async addMultiple(conf, hidden) {
    let multiple = [];
    for (const field in conf) {
      if (conf.hasOwnProperty(field))
        multiple.push(this.add(field, conf[field]));
    }
    await Promise.all(multiple);
    if (!hidden)
      this._emitter.emit('addmultiple', this.pluginCheck({ fields: conf }));
    return true;
  }

  async removeFromDb(field) {
    let res = await this._configModel.destroyAll(this.pluginCheck({ name: field }));
    return res;
  }

  async clearInDb() {
    let res = await this._configModel.destroyAll(this._plugin ? this.pluginCheck({}) : {});
    return res;
  }

  getInstanceValue(field) {
    const instanceValue = this._instance[field];
    const instanceValueType = typeof this._instance[field];
    return instanceValueType === 'object' ? (Array.isArray(instanceValue) ? [...instanceValue] : {...instanceValue }) : instanceValue;
  }

  get(field, defaultValue) {
    let returnValue;
    if (!field)
      return this._instance;
    let fields = getDeepObjectField(field);
    if (fields && fields.length > 1) {
      let rootField = fields.shift();
      let value = getDeepObjectFieldValue(fields, this.getInstanceValue(rootField));
      if (value || value === false)
        returnValue = value;
      else
        returnValue = this._configService.get(field, defaultValue);
    } else {
      const instanceValue = this.getInstanceValue(field);
      if (instanceValue || instanceValue === false) {
        returnValue = instanceValue;
      } else
        returnValue = this._configService.get(field);
    }
    if (!returnValue && returnValue !== false)
      return defaultValue;
    return returnValue;
  }

  remove(field) {
    delete this._instance[field];
    this.removeFromDb(field);
    return true;
  }

  clear() {
    if (!this._plugin) {
      this._app.configInstance = {};
    }
    this._instance = {};
    return true;
  }

  stopWatching() {
    return this._configService.stopWatching();
  }

  async loadFromFile(ignore = []) {
    let allConfig = this._configService.dump('file');
    logger.debug('loadFromFile');
    for (const conf in allConfig) {
      if (ignore.includes(conf) === false) {
        let exist = await this.getFromDb(conf);
        if (!exist || exist === false)
          await this.add(conf, allConfig[conf], true);
      }
    }
    return true;
  }

  /**
   * add callback to 'add' event
   * @param {function} callback - function to fire
   */
  onadd(callback) {
    this._emitter.on('add', callback);
  }

  /**
   * add callback to 'addmultiple' event
   * @param {function} callback - function to fire
   */
  onaddmultiple(callback) {
    this._emitter.on('addmultiple', callback);
  }
};