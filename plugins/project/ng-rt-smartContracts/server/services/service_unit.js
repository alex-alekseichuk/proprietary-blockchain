'use strict';

const sinon = require('sinon');

const mockServiceManager = {
  add: () => {},
  remove: () => {}
};

describe.skip('service', () => {
  const service = require('./service');
  it('should call add method', () => {
    const add = sinon.spy(mockServiceManager, 'add');
    service.activate(mockServiceManager);
    add.restore();
    sinon.assert.calledOnce(add);
  });

  it('should call remove method', () => {
    const remove = sinon.spy(mockServiceManager, 'remove');
    service.deactivate(mockServiceManager);
    remove.restore();
    sinon.assert.calledOnce(remove);
  });
});
