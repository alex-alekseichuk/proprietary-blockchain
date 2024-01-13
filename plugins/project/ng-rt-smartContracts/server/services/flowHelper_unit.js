"use strict";

const sinonChai = require("sinon-chai");
const chai = require("chai");
chai.should();
const expect = chai.expect;

chai.use(sinonChai);

describe("findFlows", () => {
  const nodeRedNodes = require('../../test/flows');

  describe("findFlows:: listofTemplates", () => {
    const excludeTabName = "smart-contract*";
    const includeNodeName = "project-sc*";
    const {getSCTabs} = require("./flowHelper");
    it("Should return all SC nodes", () => {
      expect(getSCTabs(nodeRedNodes, {excludeTabName, includeNodeName})).length(5);
    });
  });

  describe("findFlows:: getNodesByFlowId", () => {
    const {getNodesByFlowId} = require("./flowHelper");

    it("Should not return any nodes", () => {
      expect(getNodesByFlowId.bind(getNodesByFlowId, nodeRedNodes, "flowId")).to.throw;
    });

    it("Should return \"SC_HelloWorld_Part1\" nodes", () => {
      expect(getNodesByFlowId(nodeRedNodes, "c4ba12e4.5e20b")).length(9);
    });

    it("Should return \"SC_HelloWorld_Part2\" nodes", () => {
      expect(getNodesByFlowId(nodeRedNodes, "c32b9969.c52b08")).length(13);
    });
  });

  describe("findFlows:: extractFlowFunctions", () => {
    const {getFunctionAndArguments,
      getNodesByFlowId} = require("./flowHelper");

    it("Should throw error", () => {
      expect(getFunctionAndArguments.bind(getFunctionAndArguments, nodeRedNodes, "Hello")).to.throw;
    });

    it("Should return \"SC_HelloWorld_Part1\" nodes", () => {
      expect(getFunctionAndArguments(getNodesByFlowId(nodeRedNodes, "c4ba12e4.5e20b")));
    });

    it("Should return \"SC_HelloWorld_Part2\" nodes", () => {
      expect(getFunctionAndArguments(nodeRedNodes, "SC_HelloWorld_Part2"));
    });

    it("Should return \"SC_HelloWorld_Part3\" nodes", () => {
      expect(getFunctionAndArguments(nodeRedNodes, "SC_HelloWorld_Part3"));
    });

    it("Should return \"SC_vehicleTransfer\" nodes", () => {
      expect(getFunctionAndArguments(nodeRedNodes, "SC_vehicleTransfer"));
    });

    it("Should return \"SC_Escrow\" nodes", () => {
      expect(getFunctionAndArguments(nodeRedNodes, "SC_Escrow"));
    });
  });
});
