"use strict";

const _ = require("lodash");
const logger = require("log4js").getLogger("flowHelper");

const filterByType = (arr, type) => {
  const filteredArr = arr.filter(currentValue => currentValue.type === type);
  return filteredArr;
};

/**
 * Given an array of node red nodes extracts the Smart Contract tabs
 *
 * @param {Array} nodesArr Array of nodeRed nodes
 * @param {string} [templateName=""] Smart Contract template name
 * @return {Array} Array of template objects
 */
const getSCTabs = (
  nodesArr,
  {excludeTabName, includeNodeName, templateName = ""}
) => {
  try {
    // Extract sc flow tabNames
    let excludeRegex = new RegExp(excludeTabName);
    let includeRegex = new RegExp(includeNodeName);

    const scTabFlowIds = nodesArr.reduce(function(accumulator, currentValue) {
      if (currentValue.type === "tab" && !excludeRegex.test(currentValue.label)) {
        for (let index = 0; index < nodesArr.length; index++) {
          if (currentValue.id === nodesArr[index].z && includeRegex.test(nodesArr[index].type)) {
            currentValue.version = nodesArr[index].version;
            accumulator.push(currentValue);
          }
        }
      }
      return accumulator;
    }, []);

    return scTabFlowIds;
  } catch (error) {
    logger.error(error.message);
    return [];
  }
};

/**
 * Given an array of nodeRED nodes finds the id of matching templatename
 *
 * @param {Array} nodesArr Array of nodeRed nodes
 * @param {string} templateName Smart Contract template name
 * @param {string} version Smart Contract version
 * @return {string | false} id of the matching node or false
 */
const findIdOfGivenTemplate = (nodesArr, templateName, version) => {
  let matchingObj = nodesArr.find(element => element.label === templateName && element.version === version);
  if (matchingObj) {
    return matchingObj.id;
  }
  return false;
};

/**
 * Given an array of node-RED nodes and flowId; filters the related nodes for the flowId
 * @param {Array} nodesArr Array of nodeRed nodes
 * @param {string} flowId flowId of the Smart Contract
 * @return {Array} Array of matching nodes for the given flowId
 */
const getNodesByFlowId = (nodesArr, flowId) => {
  try {
    if (flowId) {
      let currentTabNodes = nodesArr.filter(
        nodeRedObj => flowId === nodeRedObj.z
      );
      return currentTabNodes;
    }
    throw new Error("Template not found!");
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Swap the element of given index
 * @param {Array} inputArr Array to swap the element in
 * @param {number} indexA index to be swapped
 * @param {number} indexB index to be swapped with
 */
function swap(inputArr, indexA, indexB) {
  const temp = inputArr[indexA];

  inputArr[indexA] = inputArr[indexB];
  inputArr[indexB] = temp;
}

const findFunctionNodes = currentTabNodes => {
  try {
    // const type = "contract in";
    const contractInNodes = filterByType(currentTabNodes, "contract in");
    for (let index = 0; index < contractInNodes.length; index++) {
      const element = contractInNodes[index];
      if (element.name === "init") {
        swap(contractInNodes, index, 0);
        break;
      }
    }
    return contractInNodes;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

const mapArgumentsForFunctions = (functionNodes, currentTabNodes) => {
  try {
    let mappedFunctions = [];
    functionNodes.forEach(functionNode => {
      let mapObj = {
        name: functionNode.name,
        description: functionNode.info || "",
        functionArgs: []
      };
      let currentElementWire = _.flatten(functionNode.wires);
      for (let index = 0; index < currentTabNodes.length; index++) {
        if (currentElementWire.includes(currentTabNodes[index].id)) {
          if (currentTabNodes[index].type === "arguments") {
            mapObj.functionArgs.push({destination: currentTabNodes[index].destination,
              dataType: currentTabNodes[index].dataType,
              description: currentTabNodes[index].description});
          }
          currentElementWire = [];
          currentElementWire = _.flatten(currentTabNodes[index].wires);
          index = -1;
        }
      }
      mappedFunctions.push(mapObj);
    });
    return mappedFunctions;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

/**
 * Fetches the function and arguments for a given template name
 * @param {Array} nodeRedNodes Array of nodeRed nodes
 * @return {Array} Array of matching nodes object for the given template name
 */
const getFunctionAndArguments = nodeRedNodes => {
  try {
    let functionNodes = findFunctionNodes(nodeRedNodes);
    let mappedNodes = mapArgumentsForFunctions(functionNodes, nodeRedNodes);
    return mappedNodes;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

const getContractInfo = nodes => {
  const commentObj = nodes.find(
    currentValue => currentValue.type === "comment"
  );
  if (commentObj) return commentObj.info;
  return "Contract information node not found!";
};

module.exports = {
  getSCTabs,
  getNodesByFlowId,
  getFunctionAndArguments,
  findFunctionNodes,
  mapArgumentsForFunctions,
  getContractInfo,
  findIdOfGivenTemplate
};
