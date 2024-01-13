"use strict";

const sinonChai = require("sinon-chai");
const chai = require("chai");
chai.should();
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = require("chai").expect;
const testData = require("../../test/testData.js");
const proxyquire = require("proxyquire");

describe(__filename, () => {
  let routes;
  let mockRequest = (params = {}, query = {}, body = {}, user = {}) => ({
    params,
    query,
    body,
    user
  });
  let mockResponse = () => ({
    status: code => ({
      send: message => ({code, message})
    }),
    send: message => message
  });
  routes = proxyquire("./routes", {
    "../services/services/digital-asset": services => {
      return testData.services.get("digitalAsset");
    }
  });
  routes.init(testData.server, "ng-rt-digitalAsset");

  describe("Check createAsset route and params", () => {
    var createAssetRoute = routes.createAsset;
    routes.init(testData.server, "ng-rt-digitalAsset");

    it("clientSigning set to False; Server retrieves user keys and posts the tx", async () => {
      // Arrange
      const reqBody = {
        assetType: "assetBdbDriver",
        tx: "stringifiedTx",
        asset: {data: "dummyData"},
        amount: "1",
        ownerPublicKey: "dummyPublicKey",
        metadata: "dummyMetadata",
        isSigned: false, // clientSigning,
        assetFormat: "dummyFormat",
        txMethod: "Async"
      };
      const expectedRes = testData.resCommit;

      const req = mockRequest({}, {}, reqBody);
      const res = mockResponse();

      // Act
      const caResponse = await createAssetRoute(req, res);

      // Assert
      expect(caResponse).to.be.eql(expectedRes);
    });

    it("clientSigning set to true; Server retrieves user keys and posts the tx", async () => {
      // Arrange
      const reqBody = {
        assetType: "assetBdbDriver",
        tx: "stringifiedTx",
        amount: "1",
        ownerPublicKey: "dummyPublicKey",
        metadata: "dummyMetadata",
        isSigned: true, // clientSigning, Does it retrieve keys or rejects or signs using serverkeypair?
        assetFormat: "dummyFormat",
        txMethod: "Async"
      };
      const expectedRes = testData.resCommit;

      const req = mockRequest({}, {}, reqBody);
      const res = mockResponse();

      // Act
      const caResponse = await createAssetRoute(req, res);

      // Asserts
      expect(caResponse).to.be.eql(expectedRes);
    });

    it("CreateAsset should respond with error; checks specific msg property", async () => {
      const reqBody = {
        type: "assetBdbDriver",
        tx: "stringifiedTx",
        asset: {data: "dummyData"},
        amount: "1",
        ownerPublicKey: "dummyPublicKey",
        metadata: "dummyMetadata",
        isSigned: false, // clientSigning, Does it retrieve keys or rejects or signs using serverkeypair?
        assetFormat: "dummyFormat",
        txMethod: "Async"
      };
      const req = mockRequest({}, {}, reqBody);
      const res = mockResponse();
      const errMsg =
        'Error. "assetType" and "ownerPublicKey" are required body parameters';

      await createAssetRoute(req, res).then(caResponse => {
        expect(caResponse.message.msg).to.equal(errMsg);
      });
    });

    it("CreateAsset should respond with postedTx response", async () => {
      const req = mockRequest(
        {},
        {},
        {
          assetType: "assetBdbDriver",
          ownerPublicKey: "dummyPubkey"
        }
      );
      const res = mockResponse();
      const resCommit = testData.resCommit;
      const createAssetRes = await createAssetRoute(req, res);
      expect(createAssetRes).to.equal(resCommit);
    });
  });

  describe("Check TransferAsset route and params", () => {
    var transferAssetRoute;
    before(() => {
      transferAssetRoute = routes.transferAsset;
    });

    it("TransferAsset should respond with Error", async () => {
      const req = mockRequest();
      const res = mockResponse();
      const errMsg =
        'Error. "uid", "amount" and "assetType" are required query parameters';
      const errorResponse = await transferAssetRoute(req, res);
      expect(errorResponse).to.have.own.property("code");
      expect(errorResponse.message).to.have.deep.property("msg", errMsg);
    });

    it("TransferAsset should respond postedTx", async () => {
      let body = {
        uid: "dummyUid",
        assetType: "assetBdbDriver",
        tx: "someTx"
      };
      let user = testData.user;

      let req = mockRequest({}, {}, body, user);
      const res = mockResponse();
      const transferAssetRes = await transferAssetRoute(req, res);
      expect(transferAssetRes).to.equal(testData.resCommit);
    });
  });

  describe("All routes should be callable", () => {
    const body = {
      assetType: "tendermint_blob",
      ownerPublicKey: "This is a stub",
      assetFormat: "test asset",
      isSigned: true
    };
    const query = {
      id: "txId"
    };
    const user = testData.user;

    const req = mockRequest({}, query, body, user);
    const res = {
      status: () => {
        return {
          end: () => {},
          send: () => {}
        };
      },
      send: () => {}
    };

    it("Test exported functions", function() {
      routes.should.have.property("init");
      routes.should.have.property("activate");
      routes.should.have.property("createAsset");
      routes.should.have.property("createAssetByApp");
      routes.should.have.property("getTx");
      routes.should.have.property("getAsset");
      routes.should.have.property("transferAsset");
      routes.should.have.property("transferAssetByApp");
      routes.should.have.property("createAssetDefinition");
      routes.should.have.property("getAssetDefinitions");
      routes.should.have.property("getBalance");
      routes.should.have.property("getTxHistory");
      routes.should.have.property("getAssetHistory");
    });

    it("route /assetDefinitions should be callable", () => {
      routes.getAssetDefinitions(req, res);
    });

    it("route /transactions/app/:id should be callable", () => {
      routes.getTx(req, res);
    });

    it("route /assets/app/:id should be callable", () => {
      routes.getAsset(req, res);
    });
  });
});
