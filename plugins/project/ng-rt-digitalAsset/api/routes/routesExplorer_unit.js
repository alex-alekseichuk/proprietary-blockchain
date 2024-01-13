"use strict";

const sinonChai = require("sinon-chai");
const chai = require("chai");
chai.should();
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.use(sinonChai);
const expect = require("chai").expect;
const testData = require("../../test/testDataExplorer.js");
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
  routes = proxyquire("./routesExplorer", {
    "../services/services/block-explorer": services => {
      return testData.services.get("blockExplorer");
    }
  });
  routes.init(testData.server, "ng-rt-digitalAsset");

  describe("get block by hash", () => {
    var getBlockbyHashRoute = routes.getBlockByHash;
    routes.init(testData.server, "ng-rt-digitalAsset");

    it("when block hash is valid", async () => {
            // Arrange
      const reqParams = {
        blockHash: "50d1acb0428a58b446cc77b2a2d10934419e50e2d64dc2f68ffb491010fc8c57"
      };
      const expectedRes = testData.block[1];

      const req = mockRequest(reqParams, {}, {});
      const res = mockResponse();

            // Act
      const caResponse = await getBlockbyHashRoute(req, res);

            // Assert
      expect(caResponse.message).to.be.eql(expectedRes);
    });
  });

  describe("get all block", () => {
    var getBlocksRoute = routes.getBlocks;
    routes.init(testData.server, "ng-rt-digitalAsset");

    it("when block exists", async () => {
            // Arrange
      const reqParams = {
      };
      const expectedRes = testData.block;

      const req = mockRequest(reqParams, {}, {});
      const res = mockResponse();

            // Act
      const caResponse = await getBlocksRoute(req, res);

            // Assert
      expect(caResponse.message).to.be.eql(expectedRes);
    });
  });

  describe("get block by height", () => {
    var getBlockbyHeightRoute = routes.getBlockByHeight;
    routes.init(testData.server, "ng-rt-digitalAsset");

    it("when block height is valid", async () => {
            // Arrange
      const reqParams = {
        blockHeight: "31"
      };
      const expectedRes = testData.block[0];

      const req = mockRequest(reqParams, {}, {});
      const res = mockResponse();

            // Act
      const caResponse = await getBlockbyHeightRoute(req, res);

            // Assert
      expect(caResponse.message).to.be.eql(expectedRes);
    });
  });

  describe("get block from/to height", () => {
    var getBlockinHeightsRoute = routes.getBlocksWithinHeight;
    routes.init(testData.server, "ng-rt-digitalAsset");

    it("from", async () => {
            // Arrange
      const reqQuery = {
        from: "31"
      };
      const expectedRes = testData.block;

      const req = mockRequest({}, reqQuery, {});
      const res = mockResponse();

            // Act
      const caResponse = await getBlockinHeightsRoute(req, res);

            // Assert
      expect(caResponse.message).to.be.eql(expectedRes);
    });

    it("to", async () => {
            // Arrange
      const reqQuery = {
        from: "35"
      };

      const expectedRes = testData.block;

      const req = mockRequest({}, reqQuery, {});
      const res = mockResponse();

            // Act
      const caResponse = await getBlockinHeightsRoute(req, res);

            // Asserts
      expect(caResponse.message).to.be.eql(expectedRes);
    });
  });

  describe("get block from/to time", () => {
    var getBlockinTimeRoute = routes.getBlocksByTime;
    routes.init(testData.server, "ng-rt-digitalAsset");

    it("from", async () => {
            // Arrange
      const reqQuery = {
        from: "1567413640"
      };
      const expectedRes = testData.block;

      const req = mockRequest({}, reqQuery, {});
      const res = mockResponse();

            // Act
      const caResponse = await getBlockinTimeRoute(req, res);

            // Assert
      expect(caResponse.message).to.be.eql(expectedRes);
    });

    it("to", async () => {
            // Arrange
      const reqQuery = {
        from: "1567413641"
      };

      const expectedRes = testData.block;

      const req = mockRequest({}, reqQuery, {});
      const res = mockResponse();

            // Act
      const caResponse = await getBlockinTimeRoute(req, res);

            // Asserts
      expect(caResponse.message).to.be.eql(expectedRes);
    });
  });

  describe("get transaction by hash", () => {
    var getTxbyHashRoute = routes.getTxByHash;
    routes.init(testData.server, "ng-rt-digitalAsset");

    it("when transaction hash is valid", async () => {
            // Arrange
      const reqParams = {
        txHash: "70c1383a7c6a136b7556ef278cf00fb9b9ff635c86e926cbdb29ae5f1dc72059"
      };
      const expectedRes = testData.txs[0];

      const req = mockRequest(reqParams, {}, {});
      const res = mockResponse();

            // Act
      const caResponse = await getTxbyHashRoute(req, res);

            // Assert
      expect(caResponse.message).to.be.eql(expectedRes);
    });
  });

  describe("get all transactions", () => {
    var getTransactionsRoute = routes.getTransactions;
    routes.init(testData.server, "ng-rt-digitalAsset");

    it("when block exists", async () => {
            // Arrange
      const reqParams = {
      };
      const expectedRes = testData.txs;

      const req = mockRequest(reqParams, {}, {});
      const res = mockResponse();

            // Act
      const caResponse = await getTransactionsRoute(req, res);

            // Assert
      expect(caResponse.message).to.be.eql(expectedRes);
    });
  });

  describe("get transactions from/to time", () => {
    var gettxInTimeRoute = routes.getTxsByTime;
    routes.init(testData.server, "ng-rt-digitalAsset");

    it("from", async () => {
            // Arrange
      const reqQuery = {
        from: "1587114235"
      };
      const expectedRes = testData.txs;

      const req = mockRequest({}, reqQuery, {});
      const res = mockResponse();

            // Act
      const caResponse = await gettxInTimeRoute(req, res);

            // Assert
      expect(caResponse.message).to.be.eql(expectedRes);
    });

    it("to", async () => {
            // Arrange
      const reqQuery = {
        from: "1587117490"
      };

      const expectedRes = testData.txs;

      const req = mockRequest({}, reqQuery, {});
      const res = mockResponse();

            // Act
      const caResponse = await gettxInTimeRoute(req, res);

            // Asserts
      expect(caResponse.message).to.be.eql(expectedRes);
    });
  });

  describe("get asset by txId", () => {
    var getAssetbyTxIdRoute = routes.getAssetByTxId;
    routes.init(testData.server, "ng-rt-digitalAsset");

    it("when transaction hash is valid", async () => {
            // Arrange
      const reqParams = {
        txId: "70c1383a7c6a136b7556ef278cf00fb9b9ff635c86e926cbdb29ae5f1dc72059"
      };
      const expectedRes = testData.assets[0];

      const req = mockRequest(reqParams, {}, {});
      const res = mockResponse();

            // Act
      const caResponse = await getAssetbyTxIdRoute(req, res);

            // Assert
      expect(caResponse.message).to.be.eql(expectedRes);
    });
  });

  describe("get all assets", () => {
    var getAssetssRoute = routes.getAssets;
    routes.init(testData.server, "ng-rt-digitalAsset");

    it("when block exists", async () => {
            // Arrange
      const reqParams = {
      };
      const expectedRes = testData.assets;

      const req = mockRequest(reqParams, {}, {});
      const res = mockResponse();

            // Act
      const caResponse = await getAssetssRoute(req, res);

            // Assert
      expect(caResponse.message).to.be.eql(expectedRes);
    });
  });

  describe("get assets from/to time", () => {
    var getassetsInTimeRoute = routes.getAssetsByTime;
    routes.init(testData.server, "ng-rt-digitalAsset");

    it("from", async () => {
            // Arrange
      const reqQuery = {
        from: "1587114235"
      };
      const expectedRes = testData.assets;

      const req = mockRequest({}, reqQuery, {});
      const res = mockResponse();

            // Act
      const caResponse = await getassetsInTimeRoute(req, res);

            // Assert
      expect(caResponse.message).to.be.eql(expectedRes);
    });

    it("to", async () => {
            // Arrange
      const reqQuery = {
        from: "1587117490"
      };

      const expectedRes = testData.assets;

      const req = mockRequest({}, reqQuery, {});
      const res = mockResponse();

            // Act
      const caResponse = await getassetsInTimeRoute(req, res);

            // Asserts
      expect(caResponse.message).to.be.eql(expectedRes);
    });
  });

  describe("All routes should be callable", () => {
    const body = {
    };
    const query = {
    };

    const req = mockRequest({}, query, body);
    const res = {
      status: () => {
        return {
          end: () => { },
          send: () => { }
        };
      },
      send: () => { }
    };

    it("Test exported functions", function() {
      routes.should.have.property("init");
      routes.should.have.property("activate");
      routes.should.have.property("getBlockByHash");
      routes.should.have.property("getBlockByHeight");
      routes.should.have.property("getBlocksWithinHeight");
      routes.should.have.property("getBlocks");
      routes.should.have.property("getBlocksByTime");
      routes.should.have.property("getTransactions");
      routes.should.have.property("getTxByHash");
      routes.should.have.property("getTxsByTime");
      routes.should.have.property("getAssets");
      routes.should.have.property("getAssetByTxId");
    });

    it("route /blocks should be callable", () => {
      routes.getBlocks(req, res);
    });

    it("route /blocks/hash/:blockHash should be callable", () => {
      routes.getBlockByHash(req, res);
    });

    it("route /blocks/height/:blockHeight should be callable", () => {
      routes.getBlockByHeight(req, res);
    });

    it("route /blocks/heights should be callable", () => {
      routes.getBlocksWithinHeight(req, res);
    });
    it("route /blocks/time should be callable", () => {
      routes.getBlocksByTime(req, res);
    });

    it("route /txs should be callable", () => {
      routes.getTransactions(req, res);
    });
    it("route /txs/hash/:txHash should be callable", () => {
      routes.getTxByHash(req, res);
    });
    it("route /txs/time should be callable", () => {
      routes.getTxsByTime(req, res);
    });

    it("route /assets/all should be callable", () => {
      routes.getAssets(req, res);
    });
    it("route /assets/assets/:txId should be callable", () => {
      routes.getAssetByTxId(req, res);
    });
    it("route /assets/time should be callable", () => {
      routes.getAssetsByTime(req, res);
    });
  });
});
