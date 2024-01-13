'use strict';
const proxyquire = require('proxyquire').noCallThru();
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const getLogger = sinon.stub();
getLogger.returns({trace: sinon.spy()});
const log4jsMock = {
  getLogger
};
const configServiceMock = {
  get: sinon.stub()
};
let defaultUsers = [{
  roleName: 'admin',
  userName: 'admin'
}, {
  roleName: 'appadmin',
  userName: 'appadmin'
}, {
  roleName: 'sysadmin',
  userName: 'sysadmin'
}, {
  roleName: 'licadmin',
  userName: 'licadmin'
}, {
  roleName: 'user',
  userName: 'user1'
}, {
  roleName: 'user',
  userName: 'user3'
}];
const {createDefaultUsers, distinctRoles, _getDefaultUserPassword} =
  proxyquire('../../../../../server/boot/helper_functions/createDefaultUsers', {
    'log4js': log4jsMock,
    '../../backend/configService': configServiceMock,
    '../../../common/utils/roles': () => {}
  });

describe(`In server/boot/helper_functions/authentication.js:`, () => {
  const User = {
    create: sinon.spy()
  };
  const server = {
    models: {
      User,
      Role: {}
    }
  };
  let userName;

  beforeEach(() => {
    User.create.resetHistory();
    configServiceMock.get.resetHistory();
    userName = Math.random().toString();
  });

  describe('createDefaultUsers function', () => {
    it('SHOULD call findOrCreateRoles with default users roles', () => {
      const findOrCreateRolesSpy = sinon.stub().returns(new Promise(() => {}));
      const distinctedRoles = distinctRoles(defaultUsers.map(user => user.roleName));

      expect(findOrCreateRolesSpy).to.not.been.called;
      createDefaultUsers(server, defaultUsers, findOrCreateRolesSpy);
      expect(findOrCreateRolesSpy).to.have.been.calledWith(distinctedRoles);
    });

    it('SHOULD call findOrCreateUsers with default users', done => {
      const findOrCreateRolesSpy = sinon.stub().returns(Promise.resolve({find: () => {}}));
      const findOrCreateUsersSpy = sinon.stub();

      expect(findOrCreateUsersSpy).to.not.been.called;
      createDefaultUsers(server, defaultUsers, findOrCreateRolesSpy, findOrCreateUsersSpy)
        .then(() => {
          expect(findOrCreateUsersSpy).to.have.been.calledWith(defaultUsers);
          done();
        });
    });
  });

  describe('_getDefaultUserPassword function', () => {
    it('SHOULD retrieve encoded password from correct env var', () => {
      expect(configServiceMock.get).to.not.been.called;
      _getDefaultUserPassword(userName);
      expect(configServiceMock.get).to.have.been.calledOnce;
      expect(configServiceMock.get).to.have.been.calledWithExactly(`pwd_${userName}`);
    });

    it('SHOULD return decoded password', () => {
      const password = Math.random().toString();
      const buff = new Buffer(password);
      const encodedPassword = buff.toString('base64');
      configServiceMock.get.returns(encodedPassword);
      _getDefaultUserPassword(userName);
      expect(_getDefaultUserPassword(userName)).to.be.equal(password);
    });

    it('SHOULD return default password if no env var provided', () => {
      configServiceMock.get.returns(null);
      const defaultPassword = 'project@2020';
      expect(_getDefaultUserPassword(userName)).to.be.equal(defaultPassword);
    });
  });
});
