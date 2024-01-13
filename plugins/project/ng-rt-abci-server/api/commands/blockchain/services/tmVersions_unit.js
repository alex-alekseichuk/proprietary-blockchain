'use strict';

const chai = require('chai');
chai.should();
const expect = chai.expect;

describe('Compare the requested and supported Tendermint versions', () => {
  const tmVersions = require('./tmVersions');
  beforeEach(() => {
  });

  const fakeSupportedVersions = [
    {
      name: "major",
      version: "0.31.0"
    },
    {
      name: "major",
      version: "0.32.0"
    }
  ];

  let currentVersion = {};

  it('Returns true', async() => {
    currentVersion = {version: '0.31.1'};
    let response = await tmVersions.checkTmVersion(currentVersion, fakeSupportedVersions);
    // console.log('----',response)
    expect(response).to.be.true;
  });

  it('Returns true', async() => {
    currentVersion = {version: '0.32.1'};
    let response = await tmVersions.checkTmVersion(currentVersion, fakeSupportedVersions);
    // console.log('----',response)
    expect(response).to.be.true;
  });

  it('Throws error if not compatible/unsupported versions', async() => {
    currentVersion = {version: "0.22.7-8fb2c2a0"};
    let response = await tmVersions.checkTmVersion(currentVersion, fakeSupportedVersions);
    // console.log('----',response)
    expect(response).to.be.false;
  });
});
