"use strict";
const LoopbackConfigService = require("../../../server/backend/LoopbackConfigService");

const chai = require('chai');
chai.should();

const path = require('path');
const engine = require('../engine/helper');

const i18n = {
  __: text => {

  }
};

const CONFIG = {
}

const fileConfigService = {
  get: field => CONFIG[field]
};

const createApp = () => {
  let collection = [];

  return {
    models: {
      config: {
        find: async query => {
          let founded = [];
          if (!query || !query.where || Object.keys(query.where).length === 0)
            return collection;
          for (const rec of collection) {
            let recOk = true;
            for (const key in query.where) {
              if (rec[key] !== query.where[key])
                recOk = false;
            }
            if (recOk)
              founded.push(rec);
          }
          return founded;
        },
        findOne: async query => {
          if (!query || !query.where || Object.keys(query.where).length === 0)
            return collection;
          for (const rec of collection) {
            let recOk = true;
            for (const key in query.where) {
              if (rec[key] !== query.where[key])
                recOk = false;
            }
            if (recOk)
              return rec;
          }
          return;
        },
        destroyAll: async query => {
          if (!query || !query || Object.keys(query).length === 0)
            return collection;
          for (const rec of collection) {
            let recOk = true;
            for (const key in query) {
              if (rec[key] !== query[key])
                recOk = false;
            }
            if (recOk) {
              collection.splice(collection.indexOf(rec), 1);
            }
          }
          return true;
        },
        create: async val => {
          collection.push(val);
          return val;
        },
        updateAll: (query, updater) => {
          let founded = [];
          if (!query || Object.keys(query).length === 0)
            return collection;
          for (const rec of collection) {
            let recOk = true;
            for (const key in query) {
              if (rec[key] !== query[key])
                recOk = false;
            }
            if (recOk) {
              for (const key in updater) {
                rec[key] = updater[key];
              }
              founded.push(rec);
            }
          }
          return founded;
        }
      }
    },
    collection: collection
  }
}

const TEST_CONFIG_RECORD = {
  "key": "testKey",
  "value": "testValue"
};

const TEST_CONFIG_RECORD2 = {
  "key": "testKey2",
  "value": "testValue2"
};

describe('loopback config service', function () {
  let configService;
  let app;
  
  before(async () => {
    app = createApp();
    configService = new LoopbackConfigService(i18n, fileConfigService, app);
    await configService.init()
  });

  it("should add config", async () => {
    await configService.add(TEST_CONFIG_RECORD.key, TEST_CONFIG_RECORD.value);
    app.collection[0].should.exist;
  });

  it("should added key and value equeal test", () => {
    app.collection[0].name.should.be.eq(TEST_CONFIG_RECORD.key);
    app.collection[0].valueString.should.be.eq(TEST_CONFIG_RECORD.value);
  });

  it("should update value to testValue2", async () => {
    await configService.add(TEST_CONFIG_RECORD.key, TEST_CONFIG_RECORD2.value);
    app.collection[0].valueString.should.be.eq(TEST_CONFIG_RECORD2.value);
  });

  it("should delete ", async () => {
    await configService.remove(TEST_CONFIG_RECORD.key);
    console.log(app.collection[0])
    chai.expect(app.collection[0]).to.be.undefined;
  });

  it("should add multiple", async () => {
    await configService.addMultiple({
      [TEST_CONFIG_RECORD.key]: TEST_CONFIG_RECORD.value,
      [TEST_CONFIG_RECORD2.key]: TEST_CONFIG_RECORD2.value
    });
    app.collection[0].should.exist;
    app.collection[0].name.should.be.eq(TEST_CONFIG_RECORD.key);
    app.collection[0].valueString.should.be.eq(TEST_CONFIG_RECORD.value);
    app.collection[1].should.exist;
    app.collection[1].name.should.be.eq(TEST_CONFIG_RECORD2.key);
    app.collection[1].valueString.should.be.eq(TEST_CONFIG_RECORD2.value);
  });

});