'use strict';
const chai = require('chai');
chai.should();
const path = require('path');
const engine = require('../engine/helper');

describe('mongodb backend', function () {
  before(() => engine.init());

  global.appBase = global.appBase || path.resolve(__dirname, '../../..');

  it('can connect', done => {
    try {
      const configService = engine.services.get('configService');
      const dataSources = configService.get('datasources');
      if (!dataSources)
        return;
      let dss = [];
      Object.keys(dataSources).forEach(async name => {
        const dsRecord = dataSources[name];
        if (!dsRecord.factory)
          return;
        const dsFactory = engine.services.get(dsRecord.factory);
        if (dsFactory) {
          const ds = await dsFactory.connect(dsRecord);
          dss.push(ds);
        }
      });
      for (var i = 0; i < dss.length; i++)
        dss[i].should.be.ok;
      done();
    } catch (e) {
      done(e);
    }
  });
});
