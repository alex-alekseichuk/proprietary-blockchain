'use strict';
const proxyquire = require('proxyquire').noCallThru();
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const {log4jsMock} = require('ng-rt-dev-tools/mocks');
const createDefaultUsersStub = sinon.stub();
const createDefaultAccessListStub = sinon.stub();

const enableAuthentication = proxyquire('../../../../server/boot/authentication', {
  'log4js': log4jsMock,
  './helper_functions/createDefaultUsers': {createDefaultUsers: createDefaultUsersStub},
  './helper_functions/createDefaultAccessList': {createDefaultAccessList: createDefaultAccessListStub}
});


let oldDefaultUsers = [{
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
  userName: 'user2'
}];

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
  userName: 'user2'
}, {
  roleName: 'developer',
  userName: 'developer1'
}];

describe(`In server/boot/authentication.js:`, () => {
  describe('enableAuthentication function', () => {
    const server = {
      enableAuth() {},
      models: {
        User: {
          hasMany() {}
        },
        Role: {
          hasMany() {}
        },
        Access: {
          hasMany() {}
        },
        RoleMapping: {
          belongsTo() {}
        }
      }
    };

    expect(createDefaultUsersStub).to.not.been.called;
    enableAuthentication(server,  () => {});
    
    it('SHOULD call createDefaultUsers functions only once',  () => {
      expect(createDefaultUsersStub).to.have.been.calledOnce;
    });
    it('SHOULD call createDefaultUsers with same defaultUsers\n'+JSON.stringify(defaultUsers),  () => {
        expect(createDefaultUsersStub).to.have.been.calledWithExactly(server, defaultUsers);
    });
    it('SHOULD not call createDefaultUsers with oldDefaultUsers\n'+JSON.stringify(oldDefaultUsers),  () => {
      expect(createDefaultUsersStub).not.to.have.been.calledWithExactly(server, oldDefaultUsers);
    });
  });
});
