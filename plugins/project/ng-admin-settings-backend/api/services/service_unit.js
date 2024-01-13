'use strict';

const sinon = require('sinon');

const mockServiceManager = {
  add: () => {},
  get: () => {
    return {get: () => {}};
  }
};

const pluginInstance = {
  name: {}
};

describe('service', () => {
  const service = require('./service');
  it('should call add method', () => {
    const add = sinon.spy(mockServiceManager, 'add');
    service.activate(mockServiceManager, pluginInstance);
    add.restore();
    sinon.assert.calledTwice(add);
  });
});
