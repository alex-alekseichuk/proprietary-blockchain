"use strict";

const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const chai = require("chai");
chai.should();
const expect = chai.expect;

chai.use(sinonChai);
const proxyquire = require("proxyquire");
describe("Contract Explorer", () => {
  const {jsonTest} = require("../../test/flows");
  const {services, scTabs} = require("../../test/testData.js");
  let proxiedContractExplorer;

  let source = sinon.stub().resolves(jsonTest);
  let memory = sinon.stub().resolves(jsonTest);
  let scTabsResponse = sinon.stub().returns(scTabs);
  let flowId = sinon.stub().returns("97d8b464.36f1b8"); // flowId of SC_HelloWorld_Part3
  beforeEach(() => {
    proxiedContractExplorer = proxyquire("./contractExplorer", {
      "./services/smartContract": services => {
        return {getSource: source, getMemory: memory};
      },
      "./flowHelper": {getSCTabs: scTabsResponse},
      "@noCallThru": false
    });
  });

  //   getContractTemplates,
  it("Should return all SC flows", () => {
    const excludeTabName = "smart-contract-exec*";
    const includeNodeName = "project-sc*";
    const response = proxiedContractExplorer(services).getContractTemplates({
      excludeTabName,
      includeNodeName
    });
    expect(response).to.be.equal(scTabs);
  });
  //   getContractTemplateDetails,
  it("Should fetch details for a given contract template name", async () => {
    let flowId = sinon.stub().returns("c4ba12e4.5e20b");
    proxiedContractExplorer = proxyquire("./contractExplorer", {
      "./services/smartContract": services => {
        return {getSource: source, getMemory: memory};
      },
      "./flowHelper": {
        getSCTabs: scTabsResponse,
        findIdOfGivenTemplate: flowId
      },
      "@noCallThru": false
    });
    const templateName = "SC_HelloWorld_Part1";
    const version = "1.0";
    const excludeTabName = "smart-contract-exec*";
    const includeNodeName = "project-sc*";
    const expectedResponse = {
      contractDescription: "Saving data to memory.\n\nReading from memory.",
      mappedFunctionsAndArguments: [
        {description: "", functionArgs: [{destination: "greeting", dataType: "string", description: "A simple greeting message."}], name: "init"},
        {description: "", functionArgs: [], name: "getGreeting"}
      ]
    };
    const response = await proxiedContractExplorer(
      services
    ).getContractTemplateDetails(templateName, version, {
      excludeTabName,
      includeNodeName
    });
    expect(response).to.be.deep.equal(expectedResponse);
  });

  // contractInstanceDetailsById,
  it("Should fetch details for a contract instance/contractId", async () => {
    const expectedResponse = {
      contractDescription:
        "Flow to save data to memory and read it from memory.",
      contractOwner: ["CKK9SNRcqBS2CWDZvMqG74CzwaY7sTBfzr8rDMRnVjdP"],
      publishedOn: "2020-04-29 06:49:54.564+00",
      mappedFunctionsAndArguments: [
        {description: "", functionArgs: [{destination: "greeting", dataType: "string", description: "A simple greeting message."}], name: "init"},
        {description: "", functionArgs: [], name: "getGreeting"}
      ]
    };

    proxiedContractExplorer = proxyquire("./contractExplorer", {
      "./services/smartContract": services => {
        return {getSource: source, getMemory: memory};
      },
      "./flowHelper": {
        getSCTabs: scTabsResponse,
        findIdOfGivenTemplate: flowId
      },
      "@noCallThru": false
    });
    let contractId =
      "1d2bacf74a6cb4c02375fbba7e4d08986c7543fe92cdd5a051a52c44058bc62c";
    const response = await proxiedContractExplorer(
      services
    ).contractInstanceDetailsById(contractId);
    expect(response).to.be.deep.equal(expectedResponse);
  });

  //   contractStateById,
  it("Should fetch contract memory for a given contract instance/contractId", async () => {
    const expectedResponse = '{"greeting":"Hello"}';
    let {memory} = require("../../test/testData");
    let stubMemory = sinon.stub().resolves(memory);
    proxiedContractExplorer = proxyquire("./contractExplorer", {
      "./services/smartContract": services => {
        return {getSource: source, getMemory: stubMemory};
      },
      "./flowHelper": {
        getSCTabs: scTabsResponse,
        findIdOfGivenTemplate: flowId
      },
      "@noCallThru": false
    });
    let contractId =
      "1d2bacf74a6cb4c02375fbba7e4d08986c7543fe92cdd5a051a52c44058bc62c";
    const response = await proxiedContractExplorer(services).contractStateById(
      contractId
    );
    expect(response).to.be.deep.equal(expectedResponse);
  });

  //   contractInstanceByTemplateName,
  it("Should fetch contractInstanceByTemplateName", async () => {
    proxiedContractExplorer = proxyquire("./contractExplorer", {
      "./services/smartContract": services => {
        return {getSource: source, getMemory: memory};
      },
      "./flowHelper": {
        getSCTabs: scTabsResponse,
        findIdOfGivenTemplate: flowId
      },
      "@noCallThru": false
    });
    const templateName = "SC_HelloWorld_Part3";
    const expectedResponse = [
      {
        contractId:
          "1d2bacf74a6cb4c02375fbba7e4d08986c7543fe92cdd5a051a52c44058bc62c",
        contractOwner: ["CKK9SNRcqBS2CWDZvMqG74CzwaY7sTBfzr8rDMRnVjdP"],
        createdOn: "2020-04-29 06:49:54.564+00"
      }
    ];
    const response = await proxiedContractExplorer(
      services
    ).contractInstanceByTemplateName(templateName);
    expect(response).to.be.deep.equal(expectedResponse);
  });
  //   fetchAllContractInstances
  it("Should fetch all contractInstances", async () => {
    proxiedContractExplorer = proxyquire("./contractExplorer", {
      "./services/smartContract": services => {
        return {getSource: source, getMemory: memory};
      },
      "./flowHelper": {
        getSCTabs: scTabsResponse,
        findIdOfGivenTemplate: flowId
      },
      "@noCallThru": false
    });
    const limit = 10;
    const offset = 10;
    const sortBy = "DESC";
    const contractId = "";
    const owner = "CKK9SNRcqBS2CWDZvMqG74CzwaY7sTBfzr8rDMRnVjdP";
    const createdOn = "";
    const expectedResponse = [
      {
        contractId:
          "1d2bacf74a6cb4c02375fbba7e4d08986c7543fe92cdd5a051a52c44058bc62c",
        contractOwner: ["CKK9SNRcqBS2CWDZvMqG74CzwaY7sTBfzr8rDMRnVjdP"],
        createdOn: "2020-04-29 06:49:54.564+00"
      }
    ];
    const response = await proxiedContractExplorer(
      services
    ).fetchAllContractInstances(limit, offset, sortBy, {contractId, owner, createdOn});
    expect(response).to.be.deep.equal(expectedResponse);
  });
});
