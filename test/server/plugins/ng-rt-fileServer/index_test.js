'use strict';

const path = require('path');
const fs = require('fs');
const chai = require('chai');
const should = chai.should();
const request = require('supertest');
const engineHelper = require('../../engine/helper');
const appKeysService = require('../../../../server/backend/appKeys');

// Domain ID
let domainId = 'D99';

// appID
let appID = 'ng-rt-fileServer';

// appKey for ng-rt-fileServer plugin
let appKey;

// appToken received after app login
let appToken;

// fileId of uploaded file
let fileId;

// Original file path
let originalFile = 'test.txt';

// Downloaded file
let downloadedFile = 'test_downloaded.txt';

/**
 * "Before all" hook
 */
before(() => {
  return engineHelper.init();
});

/**
 * Test cases for ng-rt-fileServer plugin
 */
describe.skip('ng-rt-fileServer', () => {
  // Create test file
  before(done => {
    let filepath = path.join(__dirname, originalFile);
    let ws = fs.createWriteStream(filepath);
    ws.write('TEST');
    ws.end();
    done();
  });

  // Delete test files
  after(done => {
    let filepaths = [path.join(__dirname, originalFile), path.join(__dirname, downloadedFile)];
    filepaths.forEach(filepath => {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    });
    done();
  });

  it('should get appKey for plugin', () => {
    return appKeysService(engineHelper.app)
      .create(appID, 0, domainId)
      .then(response => {
        appKey = response.appKey;
      });
  });

  it('should get appToken for plugin', () => {
    let appCredentials = {
      appID: appID,
      appKey: appKey
    };
    return request(engineHelper.app)
      .post('/auth/applogin')
      .send(appCredentials)
      .expect(200)
      .then(res => {
        res.should.have.property('body');
        res.body.should.have.property('token');
        should.exist(res.body.token);
        appToken = res.body.token;
      });
  });

  it('should exist for /upload route', () => {
    return request(engineHelper.app)
      .post('/fileServer/upload')
      .set('Authorization', `JWT ${appToken}`)
      .then(res => {
        res.statusCode.should.not.eq(404);
      });
  });

  it('should fail if no files sent to fileServer/upload route', () => {
    return request(engineHelper.app)
      .post('/fileServer/upload')
      .set('Authorization', `JWT ${appToken}`)
      .then(res => {
        res.statusCode.should.eq(400);
      });
  });

  it('should upload file and get fileId', () => {
    let filepath = path.join(__dirname, originalFile);
    return request(engineHelper.app)
      .post('/fileServer/upload')
      .set('Authorization', `JWT ${appToken}`)
      .set('Accept', 'application/json')
      .attach('testfile', filepath)
      .then(res => {
        res.statusCode.should.eq(200);
        res.should.have.property('body');
        res.body.should.have.property('fileId');
        should.exist(res.body.fileId);
        fileId = res.body.fileId;
      });
  });

  it('should exist for /fileServer/download route', () => {
    return request(engineHelper.app)
      .get('/fileServer/download')
      .set('Authorization', `JWT ${appToken}`)
      .then(res => {
        res.statusCode.should.not.eq(404);
      });
  });

  it('should fail if no file ID sent to /fileServer/download route', () => {
    return request(engineHelper.app)
      .get('/fileServer/download')
      .set('Authorization', `JWT ${appToken}`)
      .then(res => {
        res.statusCode.should.eq(400);
      });
  });

  it('should download uploaded file with given fileId', done => {
    let filepath = path.join(__dirname, downloadedFile);
    let stream = fs.createWriteStream(filepath);
    request(engineHelper.app)
      .get('/fileServer/download')
      .set('Authorization', `JWT ${appToken}`)
      .query({id: fileId})
      .on('response', res => {
        res.statusCode.should.eq(200);
        res.header['transfer-encoding'].should.eq('chunked');
      })
      .pipe(stream)
      .on('finish', done);
  });

  it('should check if contents of original file and downloaded file are equal', () => {
    let filepaths = [path.join(__dirname, originalFile), path.join(__dirname, downloadedFile)];
    let originalFileContent = fs.readFileSync(filepaths[0], 'utf8');
    let downloadedFileContent = fs.readFileSync(filepaths[1], 'utf8');
    originalFileContent.should.eq(downloadedFileContent);
  });
});
